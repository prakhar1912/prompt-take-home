from django.shortcuts import get_object_or_404, redirect, render
from django.contrib.auth import login as auth_login, authenticate, logout as auth_logout

from rest_framework import views
from rest_framework import viewsets
from rest_framework import status
from rest_framework import mixins
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.decorators import action
from project.models import FeedbackRequest

from project.serializers import EssaySerializer, FeedbackRequestSerializer, FeedbackResponseSerializer
from project.utilities import EditorHasOpenFeedbackResponseError, EditorNotAssignedToFeedbackRequestError, FeedbackRequestManager, FeedbackResponseExistsError, FeedbackResponseManager


class FeedbackRequestViewSet(viewsets.GenericViewSet, mixins.ListModelMixin):
	""" Viewset for views pertaining to feedback requests. """

	serializer_class = FeedbackRequestSerializer
	permission_classes = (IsAuthenticated,)

	def get_queryset(self):
		return FeedbackRequestManager.query_for_user(self.request.user).select_related('essay')

	@action(methods=['post'], detail=True, url_path='start-response', url_name='start-response')
	def start_response(self, request, pk, *args, **kwargs):
		""" Start a new FeedbackResponse, if possible.

			Returns a 400 if the FeedbackRequest has already been taken.

			Returns a 201 with a serialized FeedbackResponse if the request succeeds.
		"""
		# This isn't great but we skip `get_queryset` and let the manager enforce perms here to get clean errors
		feedback_request = get_object_or_404(FeedbackRequest, pk=pk)
		try:
			feedback_response = FeedbackResponseManager.create_for_feedback_request(
				self.request.user, feedback_request
			)
			return Response(
				FeedbackResponseSerializer(
					feedback_response, context={
						FeedbackResponseSerializer.INCLUDE_PREVIOUS_REVISIONS: True
					}
				).data,
				status=status.HTTP_201_CREATED
			)
		except FeedbackResponseExistsError:
			return Response(
				{'detail': f'Feedback request {feedback_request.pk} already has an open feedback response.'},
				status=status.HTTP_400_BAD_REQUEST
			)
		except EditorHasOpenFeedbackResponseError:
			return Response(
				{
				'detail': f'You cannot start feedback on request {feedback_request.pk} because you have another' \
                                                                                                                                     + ' unfinished feedback response.'
				},
				status=status.HTTP_400_BAD_REQUEST
			)
		except EditorNotAssignedToFeedbackRequestError:
			return Response(
				{'detail': 'That feedback request is not assigned to you.'}, status=status.HTTP_400_BAD_REQUEST
			)


class FeedbackResponseViewSet(
	viewsets.GenericViewSet, mixins.RetrieveModelMixin, mixins.ListModelMixin, mixins.UpdateModelMixin
):
	""" Viewset for views pertaining to feedback responses.

		Includes previous feedback on responses in detail endpoints.

		Query params:
			only_finished: If 'true', only finished FeedbackResponses will be returned.
			only_unfinished: If 'true', only unfinished FeedbackResponses will be returned.
	"""

	serializer_class = FeedbackResponseSerializer
	permission_classes = (IsAuthenticated,)

	def get_queryset(self):
		return FeedbackResponseManager.query_for_user(self.request.user).select_related('feedback_request__essay')

	def get_serializer_context(self):
		context = super().get_serializer_context()
		if self.detail:
			context[FeedbackResponseSerializer.INCLUDE_PREVIOUS_REVISIONS] = True
		return context

	def filter_queryset(self, queryset):
		if self.request.query_params.get('only_finished') == 'true':
			queryset = queryset.filter(finished=True)
		if self.request.query_params.get('only_unfinished') == 'true':
			queryset = queryset.filter(finished=False)
		return super().filter_queryset(queryset)

	def update(self, *args, **kwargs):
		feedback_response = self.get_object()
		if feedback_response.finished:
			return Response(
				{'detail': 'You cannot update that response because it is finished.'},
				status=status.HTTP_400_BAD_REQUEST
			)
		return super().update(*args, **kwargs)

	@action(methods=['post'], detail=True)
	def finish(self, request, pk, *args, **kwargs):
		""" Finish the specified FeedbackResponse.

			No effect if the specified FeedbackResponse is already finished.

			Returns 200 on success.
		"""
		feedback_response = self.get_object()
		if not feedback_response.finished:
			feedback_response_manager = FeedbackResponseManager(feedback_response)
			feedback_response_manager.finish()
		return Response(self.get_serializer(feedback_response).data)


class HomeView(views.APIView):
	""" View that takes users who navigate to `/` to the correct page, depending on login status. """

	def get(self, *args, **kwargs):
		if self.request.user.is_authenticated:
			return redirect('/platform/')
		return redirect('/login/')


class PlatformView(views.APIView):
	""" View that renders the essay review platform. """

	permission_classes = (IsAuthenticated,)

	def get(self, *args, **kwargs):
		return render(self.request, 'project/platform.html', {})


class LoginView(views.APIView):
	""" View for user login. """

	def get(self, *args, **kwargs):
		if self.request.user.is_authenticated:
			return redirect('/platform/')
		return render(self.request, 'project/login.html', {})

	def post(self, request, *args, **kwargs):
		user = authenticate(request, username=request.data.get('username'), password=request.data.get('password'))
		if user is None:
			# Auth failure
			return Response({'detail': 'Incorrect email or password.'}, status=status.HTTP_403_FORBIDDEN)
		auth_login(request, user)
		return Response(status=status.HTTP_204_NO_CONTENT)


class LogoutView(views.APIView):
	""" View for user logout. """

	def post(self, request, *args, **kwargs):
		auth_logout(request)
		return Response(status=status.HTTP_204_NO_CONTENT)
