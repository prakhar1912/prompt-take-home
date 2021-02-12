from rest_framework import serializers

from project.models import Essay, FeedbackRequest, FeedbackResponse


class EssaySerializer(serializers.ModelSerializer):
	""" Serialize an Essay. """

	class Meta:
		model = Essay
		fields = (
			'pk',
			'name',
			'uploaded_by',
			'content',
			'revision_of',
		)


class FeedbackRequestSerializer(serializers.ModelSerializer):
	""" Serialize a FeedbackRequest. """

	essay = EssaySerializer()

	class Meta:
		model = FeedbackRequest
		fields = ('pk', 'essay', 'deadline')


class FeedbackResponseSerializer(serializers.ModelSerializer):
	""" Serialize a FeedbackResponse. """

	INCLUDE_PREVIOUS_REVISIONS = 'previous_revisions'

	def __init__(self, *args, **kwargs):
		super().__init__(*args, **kwargs)
		if not self.context.get(self.INCLUDE_PREVIOUS_REVISIONS):
			self.fields.pop('previous_revision_feedback')

	previous_revision_feedback = serializers.SerializerMethodField()
	feedback_request = FeedbackRequestSerializer(read_only=True)

	def get_previous_revision_feedback(self, obj: FeedbackResponse):
		""" Get feedback on previous revisions of the FeedbackResponse, if any.

			This is represented as a list of FeedbackRequests on Essays of which the essay being edited is a revision.

			This field is only included if context['previous_revisions'] == True.
		"""
		previous_feedback_requests = []
		essay: Essay = obj.feedback_request.essay
		while essay.revision_of:
			essay = essay.revision_of
			if hasattr(essay, 'feedback_request') and essay.feedback_request is not None:
				previous_feedback_requests.append(essay.feedback_request)
		return FeedbackRequestSerializer(previous_feedback_requests, many=True).data

	class Meta:
		model = FeedbackResponse
		fields = (
			'pk', 'feedback_request', 'created', 'finished', 'finish_time', 'editor', 'content',
			'previous_revision_feedback'
		)
		read_only_fields = (
			'pk', 'feedback_request', 'created', 'finished', 'finish_time', 'editor', 'previous_revision_feedback'
		)
