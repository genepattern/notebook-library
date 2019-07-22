from __future__ import unicode_literals

from django.conf.urls import include, url
from django.conf.urls.i18n import i18n_patterns
from django.contrib import admin
from django.views.i18n import set_language
from mezzanine.core.views import direct_to_template
from mezzanine.conf import settings
from django.conf.urls.static import static


# Uncomment to use blog as home page. See also urlpatterns section below.
# from mezzanine.blog import views as blog_views
from rest_framework import routers

from library.views import dashboard, analyses, run_analysis, serve_thumbnail, library, guide, documentation #home
from nbrepo import preview
from nbrepo.preview import preview_image
from nbrepo.sharing import SharingViewSet, CollaboratorViewSet
from nbrepo.views import UserViewSet, GroupViewSet, WebtourViewSet, CommentViewSet, NotebookViewSet, TagViewSet, notebook_usage, launch_counter, download, copy, \
    webtour_seen, obtain_auth_token

admin.autodiscover()

# Routers provide an easy way of automatically determining the URL conf.
router = routers.DefaultRouter()
router.register(r'users', UserViewSet)
router.register(r'groups', GroupViewSet)
router.register(r'webtours', WebtourViewSet)
router.register(r'comments', CommentViewSet)
router.register(r'notebooks', NotebookViewSet)
router.register(r'tags', TagViewSet)
router.register(r'sharing', SharingViewSet)
router.register(r'collaborators', CollaboratorViewSet)

# Add the urlpatterns for any custom Django applications here.
# You can also change the ``home`` view to add your own functionality
# to the project's homepage.

urlpatterns = i18n_patterns(
    # Admin Interface
    url(r"^admin/", include(admin.site.urls)),
    # url(r'^contact/', include('contact.urls')),
    # url(r'^library/', include('library.urls')),

    # Django REST Framework
    # url(r'^rest/', include('rest_framework.urls', namespace='rest_framework')),
    url(r'^rest/api-auth/', include('rest_framework.urls', namespace='rest_framework')),
    url(r'^rest/api-token-auth/', obtain_auth_token),
    url(r'^rest/', include(router.urls)),

    # Notebook Repository
    url(r'^rest/notebooks/stats/$', notebook_usage),
    url(r'^rest/notebooks/(?P<pk>[0-9]+)/launched/$', launch_counter),
    url(r'^rest/notebooks/(?P<pk>[0-9]+)/copy/(?P<api_path>.*)$', copy),
    url(r'^rest/notebooks/(?P<pk>[0-9]+)/download/$', download),
    # url(r'^rest/notebooks/(?P<pk>[0-9]+)/preview/$', preview),
    url(r'^rest/notebooks/(?P<pk>[0-9]+)/preview/image/$', preview_image),

    # REST API URLs
    url("^api/", include("mezzanine_api.urls")),

    # Webtour endpoints
    url(r'^rest/webtours/(?P<user>.*)/$', webtour_seen),

    # Notebook Library
    url(r'^thumbnail/(?P<id>[0-9]+)/$', serve_thumbnail),
    url(r'^dashboard/$', dashboard),
    url(r'^library/$', library),
    url(r'^analyses/$', analyses),
    url(r'^guide/$', guide),
    url(r'^documentation/$', documentation),
    url(r'^analyses/(?P<lsid>.*)/$', run_analysis),
)

if settings.USE_MODELTRANSLATION:
    urlpatterns += [
        url('^i18n/$', set_language, name='set_language'),
    ] + static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)

urlpatterns += [
    # We don't want to presume how your homepage works, so here are a
    # few patterns you can use to set it up.

    # HOMEPAGE AS STATIC TEMPLATE
    # ---------------------------
    # This pattern simply loads the index.html template. It isn't
    # commented out like the others, so it's the default. You only need
    # one homepage pattern, so if you use a different one, comment this
    # one out.

    url(r"^$", direct_to_template, {"template": "pages/index.html"}, name="home"),

    # HOMEPAGE AS AN EDITABLE PAGE IN THE PAGE TREE
    # ---------------------------------------------
    # This pattern gives us a normal ``Page`` object, so that your
    # homepage can be managed via the page tree in the admin. If you
    # use this pattern, you'll need to create a page in the page tree,
    # and specify its URL (in the Meta Data section) as "/", which
    # is the value used below in the ``{"slug": "/"}`` part.
    # Also note that the normal rule of adding a custom
    # template per page with the template name using the page's slug
    # doesn't apply here, since we can't have a template called
    # "/.html" - so for this case, the template "pages/index.html"
    # should be used if you want to customize the homepage's template.
    # NOTE: Don't forget to import the view function too!

    # url("^$", home, {"slug": "/", "template": "pages/index.html"}, name="home"),

    # HOMEPAGE FOR A BLOG-ONLY SITE
    # -----------------------------
    # This pattern points the homepage to the blog post listing page,
    # and is useful for sites that are primarily blogs. If you use this
    # pattern, you'll also need to set BLOG_SLUG = "" in your
    # ``settings.py`` module, and delete the blog page object from the
    # page tree in the admin if it was installed.
    # NOTE: Don't forget to import the view function too!

    # url(r"^$", blog_views.blog_post_list, name="home"),

    # MEZZANINE'S URLS
    # ----------------
    # ADD YOUR OWN URLPATTERNS *ABOVE* THE LINE BELOW.
    # ``mezzanine.urls`` INCLUDES A *CATCH ALL* PATTERN
    # FOR PAGES, SO URLPATTERNS ADDED BELOW ``mezzanine.urls``
    # WILL NEVER BE MATCHED!

    # If you'd like more granular control over the patterns in
    # ``mezzanine.urls``, go right ahead and take the parts you want
    # from it, and use them directly below instead of using
    # ``mezzanine.urls``.
    url(r"^", include("mezzanine.urls")),

    # MOUNTING MEZZANINE UNDER A PREFIX
    # ---------------------------------
    # You can also mount all of Mezzanine's urlpatterns under a
    # URL prefix if desired. When doing this, you need to define the
    # ``SITE_PREFIX`` setting, which will contain the prefix. Eg:
    # SITE_PREFIX = "my/site/prefix"
    # For convenience, and to avoid repeating the prefix, use the
    # commented out pattern below (commenting out the one above of course)
    # which will make use of the ``SITE_PREFIX`` setting. Make sure to
    # add the import ``from django.conf import settings`` to the top
    # of this file as well.
    # Note that for any of the various homepage patterns above, you'll
    # need to use the ``SITE_PREFIX`` setting as well.

    # ("^%s/" % settings.SITE_PREFIX, include("mezzanine.urls"))

]

# Adds ``STATIC_URL`` to the context of error pages, so that error
# pages can use JS, CSS and images.
handler404 = "mezzanine.core.views.page_not_found"
handler500 = "mezzanine.core.views.server_error"
