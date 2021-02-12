import uuid
import json

from typing import Optional
from django.utils import timezone
from faker import Faker

from django.test import TestCase
from django.urls import reverse
from django.contrib import auth

from project.models import Essay, FeedbackRequest, FeedbackResponse, User
from project.serializers import FeedbackResponseSerializer
from project.utilities import FeedbackRequestManager, FeedbackResponseManager

USER_PASSWORD = '12345'
JSON = 'application/json'


def user_factory(is_superuser=False) -> User:
	fake = Faker()
	email = fake.email()
	u = User.objects.create(
		first_name=fake.first_name(),
		last_name=fake.last_name(),
		username=email,
		email=email,
		is_superuser=is_superuser,
		is_staff=is_superuser
	)
	u.set_password(USER_PASSWORD)
	u.save()
	return u


def essay_factory(revision_of: Optional[Essay] = None) -> Essay:
	fake = Faker()
	admin_user = User.objects.filter(is_superuser=True).first() or user_factory(is_superuser=True)
	return Essay.objects.create(
		name=' '.join(fake.words(nb=5)),
		uploaded_by=admin_user,
		content=fake.paragraph(nb_sentences=5),
		revision_of=revision_of,
	)


def feedback_request_factory(essay: Essay, assign=False) -> FeedbackRequest:
	""" Create a feedback request. """
	feedback_request = FeedbackRequest.objects.create(essay=essay, deadline=timezone.now())
	if assign:
		feedback_request.assigned_editors.add(*User.objects.all())
	return feedback_request


class TestAuthentication(TestCase):
	""" Test user authentication: login and logout. """

	def setUp(self):
		self.user = user_factory()

	def test_login(self):
		""" Check that login is functional. """
		url = reverse('user-login')

		# The user can load the /login/ page
		response = self.client.get(url)
		self.assertEqual(response.status_code, 200)
		self.assertTemplateUsed('project/login.html')

		# The user cannot login with incorrect credentials
		data = {'username': self.user.username, 'password': 'WRONG'}
		response = self.client.post(url, data=json.dumps(data), content_type=JSON)
		self.assertEqual(response.status_code, 403)

		# The user can login with correct credentials
		data = {'username': self.user.username, 'password': USER_PASSWORD}
		response = self.client.post(url, data=json.dumps(data), content_type=JSON)
		self.assertEqual(response.status_code, 204)
		user = auth.get_user(self.client)
		self.assertTrue(user.is_authenticated)

	def test_logout(self):
		""" Check that logout is functional. """
		url = reverse('user-logout')
		self.client.force_login(self.user)

		# Logging out logs out the user
		response = self.client.post(url)
		self.assertEqual(response.status_code, 204)
		user = auth.get_user(self.client)
		self.assertFalse(user.is_authenticated)


class TestPlatformView(TestCase):
	""" Verify that the platform is able to be loaded. """

	def setUp(self):
		self.user = user_factory()

	def test_load_platform(self):
		url = reverse('platform')

		# Loading the platform fails if the user is not authenticated
		response = self.client.get(url)
		self.assertEqual(response.status_code, 403)

		# Loading the platform works if the user is not authenticated
		self.client.force_login(self.user)
		response = self.client.get(url)
		self.assertEqual(response.status_code, 200)
		self.assertTemplateUsed('project/platform.html')


class TestFeedbackRequestView(TestCase):
	""" Test feedback request views. """

	def setUp(self):
		self.user = user_factory()
		self.admin = user_factory(is_superuser=True)
		self.old_essay = essay_factory()
		self.essay = essay_factory(revision_of=self.old_essay)

	def test_list_matched_feedback_requests(self):
		""" Test listing feedback requests matched with the a user. """
		url = reverse('feedback-request-list')

		# Must be authenticated to access feedback requests
		response = self.client.get(url)
		self.assertEqual(response.status_code, 403)

		self.client.force_login(self.user)

		# The user sees requests matched with them, not requests matched with others
		fr_matched_with_editor = feedback_request_factory(self.essay)
		fr_matched_with_editor.assigned_editors.add(self.user)
		fr_matched_with_editor.assigned_editors.add(self.admin)
		fr_not_matched_with_editor = feedback_request_factory(self.old_essay)
		fr_not_matched_with_editor.assigned_editors.add(self.admin)

		response = self.client.get(url)
		self.assertEqual(response.status_code, 200)
		data = json.loads(response.content)
		self.assertEqual(len(data), 1)
		self.assertEqual(data[0].get('pk'), fr_matched_with_editor.pk)
		self.assertIsInstance(data[0].get('essay'), dict)

		# The user sees requests with an active feedback response
		feedback_response = FeedbackResponseManager.create_for_feedback_request(self.user, fr_matched_with_editor)
		response = self.client.get(url)
		self.assertEqual(response.status_code, 200)
		data = json.loads(response.content)
		self.assertEqual(len(data), 1)
		self.assertEqual(data[0].get('pk'), fr_matched_with_editor.pk)

		# But only if the feedback response is their own
		feedback_response.editor = self.admin
		feedback_response.save()
		response = self.client.get(url)
		self.assertEqual(response.status_code, 200)
		data = json.loads(response.content)
		self.assertEqual(len(data), 0)

		# The user does not see requests that are completely finished
		feedback_response.editor = self.user
		feedback_response.save()
		FeedbackResponseManager(feedback_response).finish()
		response = self.client.get(url)
		self.assertEqual(response.status_code, 200)
		data = json.loads(response.content)
		self.assertEqual(len(data), 0)

	def test_start_response(self):
		""" Test starting a response. """
		feedback_request_1 = feedback_request_factory(self.essay)
		feedback_request_2 = feedback_request_factory(self.old_essay)
		url = reverse('feedback-request-start-response', kwargs={'pk': feedback_request_1.pk})

		# User must be authenticated to start a response
		response = self.client.get(url)
		self.assertEqual(response.status_code, 403)

		self.client.force_login(self.user)

		# User cannot start a response on a request they are not matched with
		response = self.client.post(url)
		self.assertEqual(response.status_code, 400)
		feedback_request_1.refresh_from_db()
		self.assertFalse(feedback_request_1.feedback_responses.exists())
		self.assertIn('not assigned', str(response.content))

		feedback_request_1.assigned_editors.add(self.user, self.admin)
		feedback_request_2.assigned_editors.add(self.user, self.admin)

		# User cannot start a response on a request someone else has started
		feedback_response = FeedbackResponseManager.create_for_feedback_request(self.admin, feedback_request_1)
		response = self.client.post(url)
		self.assertEqual(response.status_code, 400)
		self.assertIn('open feedback response', str(response.content))

		feedback_response.delete()

		# User cannot start a response if they have another unfinished response
		feedback_response = FeedbackResponseManager.create_for_feedback_request(self.user, feedback_request_2)
		response = self.client.post(url)
		self.assertEqual(response.status_code, 400)
		feedback_request_1.refresh_from_db()
		self.assertFalse(feedback_request_1.feedback_responses.exists())
		self.assertIn('unfinished feedback response', str(response.content))

		feedback_response.delete()

		# User **CAN** start a response otherwise
		response = self.client.post(url)
		self.assertEqual(response.status_code, 201)
		data = json.loads(response.content)
		self.assertIn('previous_revision_feedback', data)


class FeedbackResponseViewTestCase(TestCase):
	""" Test feedback response views. """

	def setUp(self):
		self.user = user_factory()
		self.other_user = user_factory()
		self.finished_essay = essay_factory()
		self.finished_feedback_request = feedback_request_factory(self.finished_essay, assign=True)
		self.finished_feedback_response = FeedbackResponseManager.create_for_feedback_request(
			self.user, self.finished_feedback_request
		)
		FeedbackResponseManager(self.finished_feedback_response).finish()
		self.essay = essay_factory(revision_of=self.finished_essay)
		self.feedback_request = feedback_request_factory(self.essay, assign=True)

	def test_list_feedback_responses(self):
		""" Test listing feedback responses created by the current user. """
		url = reverse('feedback-response-list')
		self.client.force_login(self.user)
		unfinished_response = FeedbackResponseManager.create_for_feedback_request(self.user, self.feedback_request)

		# By default, all feedback responses, finished and unfinished, are included
		response = self.client.get(url)
		self.assertEqual(response.status_code, 200)
		data = json.loads(response.content)
		self.assertEqual(len(data), 2)
		self.assertNotIn('previous_revision_feedback', data[0])

		# Can filter to only finished
		response = self.client.get(url + '?only_finished=true')
		self.assertEqual(response.status_code, 200)
		data = json.loads(response.content)
		self.assertEqual(len(data), 1)
		self.assertEqual(data[0]['pk'], self.finished_feedback_response.pk)

		# Can filter to only unfinished
		response = self.client.get(url + '?only_unfinished=true')
		self.assertEqual(response.status_code, 200)
		data = json.loads(response.content)
		self.assertEqual(len(data), 1)
		self.assertEqual(data[0]['pk'], unfinished_response.pk)

	def test_retrieve_feedback_response(self):
		""" Test retrieving feedback responses. """
		url = reverse('feedback-response-detail', kwargs={'pk': self.finished_feedback_response.pk})

		# Can retrieve a feedback response created by current user
		self.client.force_login(self.user)
		response = self.client.get(url)
		self.assertEqual(response.status_code, 200)
		data = json.loads(response.content)
		self.assertIn('previous_revision_feedback', data)

		# Cannot retrieve a feedback response created by another user
		self.client.force_login(self.other_user)
		response = self.client.get(url)
		self.assertEqual(response.status_code, 404)

	def test_update_feedback_response(self):
		""" Test updating a feedback response. """
		unfinished_response = FeedbackResponseManager.create_for_feedback_request(self.user, self.feedback_request)
		url = reverse('feedback-response-detail', kwargs={'pk': unfinished_response.pk})
		NEW_CONTENT = 'dfsgfsdhjfdsa'

		updated_data = FeedbackResponseSerializer(unfinished_response).data
		updated_data['content'] = NEW_CONTENT

		# Cannot update a response created by another user
		self.client.force_login(self.other_user)
		response = self.client.put(url, json.dumps(updated_data), content_type=JSON)
		self.assertEqual(response.status_code, 404)
		unfinished_response.refresh_from_db()
		self.assertEqual(unfinished_response.content, '')  # Defaults to blank

		# Can update content field
		self.client.force_login(self.user)
		response = self.client.put(url, json.dumps(updated_data), content_type=JSON)
		self.assertEqual(response.status_code, 200)
		data = json.loads(response.content)
		self.assertEqual(data['content'], NEW_CONTENT)
		unfinished_response.refresh_from_db()
		self.assertEqual(unfinished_response.content, NEW_CONTENT)  # Defaults to blank
		self.assertIn('previous_revision_feedback', data)

		# Cannot update other fields
		updated_data['editor'] = self.other_user.pk
		response = self.client.put(url, json.dumps(updated_data), content_type=JSON)
		self.assertEqual(response.status_code, 200)
		unfinished_response.refresh_from_db()
		self.assertEqual(unfinished_response.content, NEW_CONTENT)
		self.assertEqual(unfinished_response.editor, self.user)

		# Cannot update a finished response
		FeedbackResponseManager(unfinished_response).finish()
		updated_data['content'] = ''
		response = self.client.put(url, json.dumps(updated_data), content_type=JSON)
		self.assertEqual(response.status_code, 400)
		unfinished_response.refresh_from_db()
		self.assertEqual(unfinished_response.content, NEW_CONTENT)

	def test_finish_feedback_response(self):
		""" Test finishing a feedback response. """
		unfinished_response = FeedbackResponseManager.create_for_feedback_request(self.user, self.feedback_request)
		url = reverse('feedback-response-finish', kwargs={'pk': unfinished_response.pk})

		# Can finish a response (happy path test)
		self.client.force_login(self.user)
		response = self.client.post(url)
		self.assertEqual(response.status_code, 200)
		data = json.loads(response.content)
		self.assertIn('previous_revision_feedback', data)
		self.assertTrue(data['finished'])
		unfinished_response.refresh_from_db()
		self.assertTrue(unfinished_response.finished)
		self.assertIsNotNone(unfinished_response.finish_time)


class TestFeedbackResponseManager(TestCase):
	""" Test the feedback response manager. """

	def setUp(self):
		self.user = user_factory()
		self.finished_essay = essay_factory()
		self.finished_feedback_request = feedback_request_factory(self.finished_essay, assign=True)
		self.finished_feedback_response = FeedbackResponseManager.create_for_feedback_request(
			self.user, self.finished_feedback_request
		)
		FeedbackResponseManager(self.finished_feedback_response).finish()
		self.essay = essay_factory()
		self.feedback_request = feedback_request_factory(self.essay, assign=True)
		self.feedback_response = FeedbackResponseManager.create_for_feedback_request(self.user, self.feedback_request)

	def test_get_previous_feedback_responses_empty(self):
		""" Test getting feedback responses when there are none. """
		self.assertEqual(len(FeedbackResponseManager(self.feedback_response).get_previous_feedback_responses()), 0)

	def test_get_previous_feedback_responses_no_revision(self):
		""" Test getting previous feedback responses when there is a revision but it was not edited """
		self.finished_feedback_response.finished = False
		self.finished_feedback_response.save()

		self.assertEqual(len(FeedbackResponseManager(self.feedback_response).get_previous_feedback_responses()), 0)

	def test_get_previous_feedback_responses_one(self):
		""" Test getting previous feedback responses when there is one revision. """
		self.essay.revision_of = self.finished_essay
		self.essay.save()

		feedback_responses = FeedbackResponseManager(self.feedback_response).get_previous_feedback_responses()
		self.assertEqual(len(feedback_responses), 1)
		self.assertEqual(feedback_responses[0], self.finished_feedback_response)

	def test_get_previous_feedback_responses_two(self):
		""" Test getting previous feedback responses when there are two revisions. """
		FeedbackResponseManager(self.feedback_response).finish()

		old_essay = essay_factory()
		old_feedback_request = feedback_request_factory(old_essay, assign=True)
		old_feedback_response = FeedbackResponseManager.create_for_feedback_request(self.user, old_feedback_request)
		FeedbackResponseManager(old_feedback_response).finish()
		self.finished_essay.revision_of = old_essay
		self.finished_essay.save()
		self.essay.revision_of = self.finished_essay
		self.essay.save()

		feedback_responses = FeedbackResponseManager(self.feedback_response).get_previous_feedback_responses()
		self.assertEqual(len(feedback_responses), 2)
		self.assertEqual(feedback_responses[0], self.finished_feedback_response)
		self.assertEqual(feedback_responses[1], old_feedback_response)
