from django.utils import timezone
from django.db import transaction
from django.db.models import query
from django.db.models.query_utils import Q
from project.models import Essay, FeedbackRequest, FeedbackResponse, User


class FeedbackResponseExistsError(Exception):
	""" Error raised when a FeedbackResponse cannot be created because one already exists. """


class EditorHasOpenFeedbackResponseError(Exception):
	""" Error raised when a FeedbackResponse cannot be created because the editor already has an open one. """


class EditorNotAssignedToFeedbackRequestError(Exception):
	""" Error raised when a FeedbackResponse cannot be created because the editor is not assigned the request. """


class FeedbackRequestManager:
	""" Helper methods related to FeedbackRequests. """

	@staticmethod
	def query_for_user(user: User):
		""" Query all FeedbackRequests available to the specified user in the editing queue.

			This includes all unstarted FeedbackRequests, and those with an unfinished FeedbackResponse belonging
			to the user.
		"""
		return FeedbackRequest.objects.filter(
			Q(assigned_editors=user) & Q(Q(feedback_responses__isnull=True) | Q(feedback_responses__editor=user))
		).exclude(feedback_responses__finished=True)


class FeedbackResponseManager:
	""" Helper methods related to FeedbackResponses. """

	def __init__(self, feedback_response: FeedbackResponse):
		self.feedback_response = feedback_response

	@staticmethod
	def create_for_feedback_request(user: User, feedback_request: FeedbackRequest):
		with transaction.atomic():
			_ = FeedbackRequest.objects.filter(pk=feedback_request.pk).select_for_update()[0]
			_ = User.objects.filter(pk=user.pk).select_for_update()[0]
			if feedback_request.feedback_responses.exists():
				raise FeedbackResponseExistsError()
			elif user.feedback_responses.filter(finished=False).exists():
				raise EditorHasOpenFeedbackResponseError()
			elif not feedback_request.assigned_editors.filter(pk=user.pk).exists():
				raise EditorNotAssignedToFeedbackRequestError()
			return FeedbackResponse.objects.create(
				editor=user,
				feedback_request=feedback_request,
			)

	@staticmethod
	def query_for_user(user: User):
		""" Query all FeedbackResponses related to the specified user. """
		return FeedbackResponse.objects.filter(editor=user)

	def finish(self):
		""" Finish the managed FeedbackResponse. """
		self.feedback_response.finish_time = timezone.now()
		self.feedback_response.finished = True
		self.feedback_response.save()

	def get_previous_feedback_responses(self):
		""" Get FeedbackResponses on previous revisions of the Essay being edited. """
		feedback_responses = []
		essay: Essay = self.feedback_response.feedback_request.essay
		while essay.revision_of:
			essay = essay.revision_of
			feedback_response = FeedbackResponse.objects.filter(finished=True, feedback_request__essay=essay).first()
			if feedback_response:
				feedback_responses.append(feedback_response)
		return feedback_responses
