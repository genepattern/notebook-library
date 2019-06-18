import json
import requests
from django.contrib.auth.backends import ModelBackend
from django.contrib.auth.models import User
from rest_framework import authentication
from rest_framework import exceptions

from library import settings


def connect_to_genepattern(username, password):
    """
    Call the GenePattern server to verify credentials
    :param username:
    :param password:
    :return:
    """
    # Set the necessary params
    params = dict(
        grant_type="password",
        username=username,
        password=password,
        client_id="GenePatternNotebookLibrary"
    )

    # Make the request of the GenePattern server
    url = settings.BASE_GENEPATTERN_URL + "/rest/v1/oauth2/token"
    resp = requests.post(url, params=params, data='', headers={"Accept": "application/json"})

    # Handle the response
    if resp is not None and resp.status_code == 200:
        # Decode the access token
        response_payload = json.loads(resp.content)

        # Lazily create the Django user object
        try:
            user = User.objects.get(username=username)
        except User.DoesNotExist:
            user = User()
            user.username = username
            user.set_password(password)
            user.save()

        # Return the username
        return (user, response_payload['access_token'])
    else:
        # This is likely a 400 Bad Request error due to an invalid username or password
        raise exceptions.AuthenticationFailed('Invalid username or password')


class GenePatternAuthenticationBackend(ModelBackend):
    """
    Base Django authentication using the GenePattern server
    """

    def authenticate(self, *args, **kwargs):
        # Get the login credentials
        if kwargs:
            username = kwargs.pop("username", None)
            password = kwargs.pop("password", None)
        else:
            return None

        # Call GenePattern server
        try:
            user, token = connect_to_genepattern(username, password)
            return user
        except exceptions.AuthenticationFailed:
            return None



class GenePatternAuthentication(authentication.BaseAuthentication):
    def authenticate(self, request):

        # Get the login credentials
        if 'username' in request.POST and 'password' in request.POST:
            username = request.POST['username']
            password = request.POST['password']
        else:
            return None

        # Call GenePattern server
        return connect_to_genepattern(username, password)
