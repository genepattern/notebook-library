// Declare server constants
export const PUBLIC_NOTEBOOK_SEVER = 'https://notebook.genepattern.org/services/sharing/';
export const GENEPATTERN_SERVER = 'https://cloud.genepattern.org/gp/';

// Declare data cache
let _public_notebooks = null;
let _notebook_tags = null;
let _pinned_tags = null;
let _shared_notebooks = null;
let _workspace_notebooks = null;
let _genepattern_modules = null;
let _genepattern_token = null;
let _jupyterhub_token = null;

/**
 * Retrieves the public notebooks from the cache, if possible, from the server if not
 *
 * @returns {Promise<any>}
 */
export function public_notebooks() {
    if (_public_notebooks !== null)
        return new Promise(function(resolve) {
            resolve(_public_notebooks['results']);
        });

    else
        return fetch(PUBLIC_NOTEBOOK_SEVER + 'notebooks/')
            .then(response => response.json())
            .then(function(response) {
                _public_notebooks = response;
                return response['results'];
            });
}

/**
 * Retrieves the list of public notebook tags from the cache, if possible, from the server if not
 *
 * @returns {Promise<any>}
 */
export function notebook_tags() {
    if (_notebook_tags !== null)
        return new Promise(function(resolve) {
            resolve(_notebook_tags);
        });

    else
        return public_notebooks().then(function(all_notebooks) {
            // Build the map of tags
            const tag_map = {};
            all_notebooks.forEach(function(nb) {
                nb.tags.forEach(function(tag) {
                    tag_map[tag.label] = tag;
                });
            });

            // Assign and return
            _notebook_tags = Object.values(tag_map);
            return new Promise(function(resolve) {
                resolve(_notebook_tags);
            });
        });
}

export function pinned_tags() {
    if (_pinned_tags !== null)
        return new Promise(function(resolve) {
            resolve(_pinned_tags);
        });

    else
        return notebook_tags().then(function(all_tags) {
            const pinned_list = [];
            all_tags.forEach(function(tag) {
                if (tag.pinned) pinned_list.push(tag);
            });

            // Assign and return
            _pinned_tags = pinned_list;
            return new Promise(function(resolve) {
                resolve(_pinned_tags);
            });
        });
}

/**
 * Retrieves the list of GenePattern modules from cache, if possible, from the server if not
 * @returns {Promise<any>}
 */
export function genepattern_modules() {
    if (_genepattern_modules !== null)
        return new Promise(function(resolve) {
            resolve(_genepattern_modules['all_modules']);
        });

    else
        return fetch(GENEPATTERN_SERVER + 'rest/v1/tasks/all.json', {
                mode: 'cors',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                }
            })
            .then(response => response.json())
            .then(function(response) {
                _genepattern_modules = response;
                return response['all_modules'];
            });
}

export function module_categories() {
    // Ensure that the modules have been retrieved
    return genepattern_modules().then(function() {
        return new Promise(function(resolve) {
            resolve(_genepattern_modules['all_categories']);
        });
    });
}

export function modal({title='GenePattern Dialog', body='', buttons={'OK':{}}}) {
    // Create the base modal element
    const modal_base = $(`<div class="modal fade" tabindex="-1" role="dialog" style="display: none;">`)
        .append(
            $(`<div class="modal-dialog modal-dialog-centered modal-lg" role="document"></div>`)
                .append(
                    $(`<div class="modal-content"></div>`)
                        .append(
                            $(`<div class="modal-header">`)
                                .append($(`<h5 class="modal-title">${title}</h5>`))
                                .append($(`<button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>`))
                        )
                        .append(
                            $(`<div class="modal-body"></div>`)
                                .html(body)
                        )
                        .append(
                            $(`<div class="modal-footer"></div>`)
                        )
                )
        );

    // Add the buttons
    const footer = modal_base.find('.modal-footer');
    Object.keys(buttons).forEach(function(label) {
        // Defaults
        const value = buttons[label];
        let btn_class = 'btn-secondary';
        let click = close_modal;

        // Read options
        if (typeof value === 'function') click = value;
        if (typeof value === 'object') {
            if (value['class']) btn_class = value['class'];
            if (value['click']) click = value['click'];
        }

        // Add the button
        footer.append(
            $(`<button type="button" class="btn ${btn_class}">${label}</button>`)
                .click(click)
        );
    });

    // Attach and show the dialog
    $("body").append(modal_base);
    modal_base.modal("show");
}

export function close_modal() {
    $('.modal').modal('hide');
}

export function message(msg, type='info') {
    const messages_box = $('#messages');
    const alert = $(`<div class="alert row alert-${type} alert-dismissible fade show" role="alert">${msg}</div>`)
        .append($(`<button type="button" class="close" data-dismiss="alert" aria-label="Close">
                       <span aria-hidden="true">&times;</span>
                   </button>`));
    messages_box.append(alert)
}

export function system_message() {
    // Get the status message
    fetch(`${GENEPATTERN_SERVER}rest/v1/config/system-message`)
        .then(msg => msg.text())
        .then(msg => message(msg));
}

export function get_cookie(name) {
    let cookie_value = null;
    if (document.cookie && document.cookie !== '') {
        let cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            let cookie = cookies[i].trim();
            // Does this cookie string begin with the name we want?
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookie_value = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookie_value;
}

export function save_login_cookie(formData) {
    document.cookie = "GenePattern=" + formData.username + "|" + encodeURIComponent(btoa(formData.password)) +
        ";path=/;domain=" + window.location.hostname;
}

export function get_login_data() {
    function username_from_cookie(cookie) {
        // Handle the null case
        if (!cookie) return null;
        // Parse the cookie
        const parts = cookie.split("|");
        if (parts.length > 1) return parts[0];
        // Cookie not in the expected format
        else return null;
    }

    function password_from_cookie(cookie) {
        // Handle the null case
        if (!cookie) return null;
        // Parse the cookie
        const parts = cookie.split("|");
        if (parts.length > 1) {
            return atob(decodeURIComponent(parts[1]));
        }
        // Cookie not in the expected format
        else return null;
    }

    const genepattern_cookie = get_cookie("GenePattern");
    if (!genepattern_cookie) return null; // Return null if cookie is not set
    else return {
        "username": username_from_cookie(genepattern_cookie),
        "password": password_from_cookie(genepattern_cookie)
    }
}

/**
 * Lazily retrieves a GenePattern authentication token and returns a promise
 *
 * @param suppress_errors
 * @param force
 * @returns {Promise<any>}
 */
export function get_genepattern_token(suppress_errors=false, force=false) {
    // Return the token, if available and not forced
    if (_genepattern_token && !force) return new Promise(function(resolve) {
        resolve(_genepattern_token);
    });

    // See if the GenePattern credentials are available
    const credentials = get_login_data();

    // Lazily retrieve the token if the credentials are available
    if (credentials) {
        return fetch(GENEPATTERN_SERVER + "rest/v1/oauth2/token?grant_type=password&username=" +
            encodeURIComponent(credentials.username) +
            "&password=" + encodeURIComponent(credentials.password) +
            "&client_id=GenePatternNotebookCatalog-" + encodeURIComponent(credentials.username), {
                method: 'POST',
                mode: 'cors',
                credentials: 'include'
            })
            .then(response => response.json())
            .then(function(response) {
                _genepattern_token = response['access_token'];
                return _genepattern_token;
            });
    }

    // If not available, write error (unless suppressed) then throw it
    else {
        const error = "Attempted to retrieve GenePattern token when the credentials weren't available.";
        if (!suppress_errors) throw error;
        return new Promise(function(resolve) {
            resolve(error);
        });
    }
}

export function login_to_genepattern(suppress_errors=false) {
    // Get the GenePattern credentials, if available
    const credentials = get_login_data();
    if (!credentials && !suppress_errors) throw 'Attempted to login when GenePattern credentials not available';

    // Create the form data object
    const data = new URLSearchParams();
    data.append('loginForm', 'loginForm');
    data.append('loginForm:signIn', 'Sign+in');
    data.append('javax.faces.ViewState', 'j_id1');
    data.append('username', credentials.username);
    data.append('password', credentials.password);

    // Login to GenePattern server
    return fetch(`${GENEPATTERN_SERVER}pages/login.jsf`, {
        method: 'POST',
        mode: 'cors',
        credentials: 'include',
        headers: {
            'origin': location.origin
        },
        body: data
    });
}

export function get_jupyterhub_token(suppress_errors=false) {
    // TODO: Implement
}

export function get_csrf() {
    // Try getting the token from the form
    const csrf_form = document.getElementById('csrf');
    const csrf_input = csrf_form ? csrf_form.querySelector('input[name=csrfmiddlewaretoken]') : false;
    let csrf_token = csrf_form && csrf_input ? csrf_input.value : false;

    // If that fails, try the cookie
    csrf_token = !csrf_token ? get_cookie('csrftoken') : csrf_token;

    // Return the token
    return csrf_token;
}

export function show_spinner() {
    const footer = $('.modal').find(".modal-footer");
    let spinner = footer.find('.spinner-border');

    // Toggle visibility on if spinner exists
    if (spinner.length) spinner.show();

    // Otherwise, add the spinner
    else footer.prepend(
        $(`<div class="spinner-border" role="status">
            <span class="sr-only">Loading...</span>
        </div>`)
    );
}

export function hide_spinner() {
    const spinner = $('.modal').find(".modal-footer").find('.spinner-border');
    if (spinner) spinner.hide();
}

export function login(username, password) {
    // Gather the form data
    const formData = {
        'username': username,
        'password': password
    };

    // Submit the form
    show_spinner();

    $.ajax({
        beforeSend: function(xhrObj){
            xhrObj.setRequestHeader("X-CSRFToken", get_csrf());
        },
        type: 'POST',
        url: `/rest/api-auth/login/`,
        crossDomain: true,
        data: formData,
        success: function (data) {
            close_modal();
            save_login_cookie(formData);
            message("GenePattern login successful.", "success");

            // Reload the page
            location.reload();
        },
        error: function(xhr) {
            close_modal();
            hide_spinner();

            // Handle errors
            try {
                message(JSON.parse(xhr.responseText).error, 'danger');
            }
            catch (e) {
                console.error(xhr.responseText);
                message("Unable to log in. Please recheck your username and password.", 'danger');
            }
        }
    });
}

/*****************
 * Vue page apps *
 *****************/

export function navbar(selector) {
    const navbar_app = new Vue({
        el: selector,
        delimiters: ['[[', ']]']
    });

    return navbar_app;
}

export function dashboard(selector) {
    // Display the system message
    system_message();

    const dashboard_app = new Vue({
        el: selector,
        delimiters: ['[[', ']]'],
        data: {
            notebooks: [],
            modules: []
        },
        computed: {
            tutorial_notebooks() {
                const tutorials = [];
                this.notebooks.forEach(function(nb) {
                    nb.tags.forEach(function(tag) {
                        if (tag.label === "tutorial") tutorials.push(nb);
                    });
                });
                return tutorials;
            }
        },
        created() {
            GenePattern.public_notebooks().then(r => this.notebooks = r);
            GenePattern.genepattern_modules().then(r => this.modules = r);
        },
        methods: {}
    });

    return dashboard_app;
}

export function library(selector) {
    const library_app = new Vue({
        el: selector,
        delimiters: ['[[', ']]'],
        data: {
            notebooks: [],
            tags: [],
            pinned: [],
            search: ''
        },
        computed: {},
        created() {
            const app = this;

            GenePattern.public_notebooks().then(r => this.notebooks = r);
            GenePattern.notebook_tags().then(r => this.tags = r);
            GenePattern.pinned_tags().then(r => this.pinned = r).then(function() {
                // Display featured notebooks by default
                app.search = "featured";
                setTimeout(() => document.querySelector('.nb-search').value = '', 1);
            });
        },
        methods: {},
        watch: {
            'search': function(event) {
                let search = this.search.trim().toLowerCase();

                // Set active tab
                const tabs = document.querySelector('.tags').querySelectorAll('.tag-tab');
                tabs.forEach(function(tab) {
                    // Matching tab
                    if (tab.textContent.toLowerCase() === search) tab.classList.add('active');

                    // Not matching tab
                    else tab.classList.remove('active');
                });

                // special case for "all notebooks"
                if (search === "all notebooks") search = "";

                // Display the matching notebooks
                const cards = document.querySelector(selector).querySelector('.notebooks').querySelectorAll('.nb-card');
                cards.forEach(function(card) {
                    // Matching notebook
                    if (card.textContent.toLowerCase().includes(search)) card.classList.remove('d-none');

                    // Not matching notebook
                    else card.classList.add('d-none');
                });
            }
        }
    });

    return library_app;
}

export function jobs(selector) {
    gp.setServer(GENEPATTERN_SERVER);
    gp.tasks({
        success: function() {
            gp.jobs({
                success: function(response) {
                    const jobs = response['items'];
                    const jobs_parent = $(selector);
                    jobs.forEach(function(job) {
                        let job_div = $("<div></div>");
                        jobs_parent.append(job_div);
                        job_div.jobResults({
                            jobNumber: parseInt(job.jobId)
                        });
                    });
                }
            });
        }
    });
}

export function run_analysis(selector, lsid) {
    gp.setServer(GENEPATTERN_SERVER);
    gp.tasks({
        success: function() {
            let task_div = $("<div></div>");
            $(selector).append(task_div);
            task_div.runTask({
                'lsid': lsid
            });
        }
    });
}

export function analyses(selector) {
    const analyses_app = new Vue({
        el: selector,
        delimiters: ['[[', ']]'],
        data: {
            modules: [],
            categories: [],
            search: ''
        },
        computed: {},
        created() {
            if (window.is_authenticated) GenePattern.login_to_genepattern();
            GenePattern.genepattern_modules().then(r => this.modules = r);
            GenePattern.module_categories().then(r => this.categories = r);
        },
        watch: {
            'search': function(event) {
                const search = this.search.trim().toLowerCase();

                // If search is blank display module categories
                if (search === '') {
                    document.querySelector(selector).querySelector('.categories').classList.remove('d-none');
                    document.querySelector(selector).querySelector('.modules').classList.add('d-none');
                }

                // Otherwise show matching modules
                else {
                    document.querySelector(selector).querySelector('.categories').classList.add('d-none');
                    document.querySelector(selector).querySelector('.modules').classList.remove('d-none');

                    const cards = document.querySelector(selector).querySelector('.modules').querySelectorAll('.mod-card');
                    cards.forEach(function(card) {
                        // Matching module
                        if (card.textContent.toLowerCase().includes(search)) card.classList.remove('d-none');

                        // Not matching module
                        else card.classList.add('d-none');
                    });
                }
            }
        }
    });

    return analyses_app;
}

export function login_form(selector) {
    const login_app = new Vue({
        el: selector,
        delimiters: ['[[', ']]'],
        data: {
            username: '',
            password: ''
        },
        watch: {
            'username': () => login_app.validate_username(),
            'password': () => login_app.validate_password()

        },
        methods: {
            'validate_password': function() {
                const login_form = $(selector);
                const password = login_form.find('input[name=password]');

                if (password.val().trim() !== '') {
                    password[0].setCustomValidity('');
                    login_form.closest('.modal').find('.btn.btn-primary').attr("disabled", false);
                    return true;
                }
                else {
                    password[0].setCustomValidity("Password cannot be blank");
                    login_form.closest('.modal').find('.btn.btn-primary').attr("disabled", true);
                    return false;
                }
            },
            'validate_username': function() {
                const login_form = $(selector);
                const username = login_form.find('input[name=username]');

                if (username.val().trim() !== '') {
                    username[0].setCustomValidity('');
                    login_form.closest('.modal').find('.btn.btn-primary').attr("disabled", false);
                    return true;
                }
                else {
                    username[0].setCustomValidity("Username cannot be blank");
                    login_form.closest('.modal').find('.btn.btn-primary').attr("disabled", true);
                    return false;
                }
            },
            'submit': function () {
                // Call the login endpoint
                login(this.username, this.password)
            }
        }
    });

    // Store reference to app in the data
    $(selector).data('app', login_app);

    return login_app;
}

export function register_form(selector) {
    const register_app = new Vue({
        el: selector,
        delimiters: ['[[', ']]'],
        data: {
            username: '',
            password: '',
            password_confirm: '',
            email: ''
        },
        watch: {
            'password_confirm': () => register_app.validate_password(),
            'password': () => register_app.validate_password(),
            'email': () => register_app.validate_email()
        },
        methods: {
            'validate_password': function() {
                const registration_form = $(selector);
                const password = registration_form.find('input[name=password]');
                const confirm = registration_form.find("input[name='confirm']");

                if (password.val() === confirm.val()) {
                    confirm[0].setCustomValidity('');
                    registration_form.closest('.modal').find('.btn.btn-primary').attr("disabled", false);
                    return true;
                }
                else {
                    confirm[0].setCustomValidity("Passwords don't match");
                    registration_form.closest('.modal').find('.btn.btn-primary').attr("disabled", true);
                    return false;
                }
            },
            'validate_email': function() {
                const registration_form = $(selector);
                const email = registration_form.find("input[name='email']");

                if (/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email.val())) {
                    email[0].setCustomValidity('');
                    registration_form.closest('.modal').find('.btn.btn-primary').attr("disabled", false);
                    return true;
                }
                else {
                    email[0].setCustomValidity("Invalid email address");
                    registration_form.closest('.modal').find('.btn.btn-primary').attr("disabled", true);
                    return false;
                }
            },
            'submit': function () {
                // Gather the form data
                const formData = {
                    'username': this.username,
                    'password': this.password,
                    'email': this.email,
                    'client_id': 'GenePattern Notebook Library'
                };

                // Submit the form
                show_spinner();
                $.ajax({
                    beforeSend: function(xhrObj){
                        xhrObj.setRequestHeader("Content-Type","application/json");
                        xhrObj.setRequestHeader("Accept","application/json");
                    },
                    type: 'POST',
                    url: `${GENEPATTERN_SERVER}rest/v1/oauth2/register`,
                    crossDomain: true,
                    data: JSON.stringify(formData),
                    dataType: 'json',
                    success: function (data) {
                        close_modal();
                        message("GenePattern registration successful. Signing in...", "success");

                        // Call the login endpoint
                        login(register_app.username, register_app.password);
                    },
                    error: function(xhr) {
                        close_modal();
                        hide_spinner();

                        // Handle errors
                        if (xhr.status === 404) {
                            message("Unable to register user. Could not contact the GenePattern server or remote registration unsupported.", 'danger');
                        }
                        else {
                            try {
                                message(JSON.parse(xhr.responseText).error, 'danger');
                            }
                            catch(e) {
                                message(xhr.responseText, 'danger');
                            }
                        }
                    }
                });
            }
        }
    });

    // Store reference to app in the data
    $(selector).data('app', register_app);

    return register_app;
}

/******************
 * Vue Components *
 ******************/

Vue.component('module-category', {
    delimiters: ['[[', ']]'],
    props: ['category'],
    methods: {
        'search_or_launch': function() {
            // If this is a module
            if (this.category.lsid) {
                window.open(`/analyses/${this.category.lsid}/`)
            }

            // If this is a category
            else {
                document.querySelector('.mod-search').value = this.category.name;
                this.$root.search = this.category.name;
            }
        }
    },
    mounted: function() {
        if (this.category.lsid) this.$el.classList.add('module');
        else this.$el.classList.add('category')
    },
    template: `<div class="card mod-card" v-on:click="search_or_launch">  
                    <div class="card-body"> 
                        <h8 class="card-title">[[ category.name ]]</h8> 
                        <div class="d-none">[[ category.tags ]] [[ category.categories ]] [[ category.suites ]]</div>
                        <p class="card-text">[[ category.description ]]</p>
                    </div> 
                </div>`
});

Vue.component('notebook-tag', {
    delimiters: ['[[', ']]'],
    props: ['tag'],
    methods: {
        'search_or_launch': function() {
            document.querySelector('.nb-search').value = this.tag.label;
            this.$root.search = this.tag.label;
        }
    },
    mounted: function() {
        this.$el.classList.add('tag');
    },
    template: `<ul class="nav-item" v-on:click="search_or_launch">  
                   <a class="nav-link tag-tab" href="#">[[ tag.label ]]</a> 
               </ul>`
    // template: `<div class="nav-item tag-card" v-on:click="search_or_launch">
    //                 <div class="nav-link">
    //                     <h8>[[ tag.label ]]</h8>
    //                 </div>
    //             </div>`
});

Vue.component('notebook-card', {
    delimiters: ['[[', ']]'],
    props: ['nb'],
    methods: {
        'preview': function() {
            // If this is a GenePattern module
            if (this.nb.lsid)
                window.open(`/analyses/${this.nb.lsid}/`);

            // If this is a notebook
            else if (this.nb.quality)
                window.open(`${PUBLIC_NOTEBOOK_SEVER}notebooks/${this.nb.id}/preview/`);
        }
    },
    computed: {
        img_src() {
            // If this is a GenePattern module
            if (this.nb.lsid) return "/static/images/banner.jpg";

            // Else, if this is a notebook
            else return `/thumbnail/${this.nb.id}/`;
        }
    },
    template: `<div class="card nb-card" v-on:click="preview"> 
                    <img class="card-img-top" v-bind:src="img_src" alt="Notebook Thumbnail"> 
                    <div class="card-body"> 
                        <h8 class="card-title">[[ nb.name ]]</h8> 
                        <p class="card-text">[[ nb.description ]]</p> 
                        <div class="card-text nb-card-tags"><span class="badge badge-secondary" v-for="tag in nb.tags">[[ tag.label ]] </span></div>
                    </div> 
                </div>`
});


Vue.component('notebook-carousel', {
    delimiters: ['[[', ']]'],
    props: {
        'header': {
            type: String,
            required: false,
            default: ''
        },
        'nblist': {
            type: Array,
            required: true
        },
        'size': {
            type: Number,
            required: false,
            default: 5
        }
    },
    data: function() {
        return {
            'loading': true,
            'page_number': 0
        }
    },
    watch: {
      'nblist': function (new_val, old_val) {
          this.loading = false;
      },
      'loading': function (new_val, old_val) {
          // Hide the loading spinner
          if (!new_val) this.$el.querySelector('.spinner-border').style.display = 'none';
          else this.$el.querySelector('.spinner-border').style.display = 'block';

          // Hide the next/previous buttons if a single page
          if (this.page_count() === 1) this.$el.querySelectorAll('.nb-carousel-button').forEach(n => n.style.display = 'none');
      }
    },
    methods: {
        next_page() {
            if (this.page_number === this.page_count()-1) this.page_number = 0;
            this.page_number++;
        },
        prev_page() {
            if (this.page_number === 0) this.page_number = this.page_count()-1;
            this.page_number--;
        },
        page_count() {
            let l = this.nblist.length,
                s = this.size;
            return Math.ceil(l/s);
        }
    },
    computed: {
        paginated() {
            const start = this.page_number * this.size,
                  end = start + this.size;

             return this.nblist.slice(start, end);
        }
    },
    template: `<div class="nb-carousel">
                   <div class="float-right show-all"><a href="#">[ Explore All ]</a></div>
                   <h1>[[ header ]]</h1>
                   <div class="nb-carousel-slider">
                       <button class="nb-carousel-button" v-on:click="prev_page">
                           <i class="fas fa-arrow-circle-left"></i>
                       </button>
                       <div class="spinner-border" role="status">
                           <span class="sr-only">Loading...</span>
                       </div>
                       <notebook-card v-for="nb in paginated" :nb="nb"></notebook-card>
                       <button class="nb-carousel-button" v-on:click="next_page">
                           <i class="fas fa-arrow-circle-right"></i>
                       </button>
                   </div>
               </div>`
});

Vue.component('login-register', {
    delimiters: ['[[', ']]'],
    props: ['title'],
    methods: {
        'toggle_forgot_password': function() {
            // Hide non-reset elements
            $('.password-row').slideUp();
            $('.btn-forgot').slideUp();
            $('.btn-login').slideUp();

            // Change the title
            $('.modal-title').text('Reset Password');

            // Show reset password button
            $('.btn-reset').removeClass('d-none');
        },
        'forgot_password': function() {
            // Get the username
            const username_or_email = document.getElementById('login_form').querySelector('input[name=username]').value;

            // Gather the form data
            const formData = {
                'usernameOrEmail': username_or_email
            };

            // Submit the form
            show_spinner();
            $.ajax({
                beforeSend: function(xhrObj){
                    xhrObj.setRequestHeader("Content-Type","application/json");
                    xhrObj.setRequestHeader("Accept","application/json");
                },
                type: 'PUT',
                url: `${GENEPATTERN_SERVER}rest/v1/oauth2/forgot-password`,
                crossDomain: true,
                data: JSON.stringify(formData),
                dataType: 'json',
                success: function (data) {
                    // Success!
                    if (data && data.message === "A new password has been emailed to you.") {
                        message("A new password has been emailed to you.", 'success');
                    }

                    // Error response!
                    else {
                        message(data.message, 'danger');
                    }

                    // Remove the spinner and modal
                    close_modal();
                    hide_spinner();
                },
                error: function(xhr) {
                    close_modal();
                    hide_spinner();
                    message("Unable to reset password. Could not contact the GenePattern server or remote password reset unsupported.", 'danger');
                }
            });
        },

        'login_dialog': function() {
            const login_register = this;

            modal({
                'title': 'Log in to GenePattern',
                'body': `<form id="login_form">
                             <div class="form-group row">
                                 <label for="username" class="col-sm-2 col-sm-3">Username</label>
                                 <div class="col-sm-9">
                                     <input name="username" type="text" class="form-control" placeholder="Username" v-model="username" v-on:keyup.13="submit">
                                 </div>
                             </div>
                             <div class="password-row form-group row">
                                 <label for="password" class="col-sm-2 col-sm-3">Password</label>
                                 <div class="col-sm-9">
                                     <input name="password" type="password" class="form-control" placeholder="Password" v-model="password" v-on:keyup.13="submit">
                                 </div>
                             </div>
                         </form>`,
                'buttons': {
                    'Forgot Password': {
                        'class': 'btn-forgot btn-outline-secondary',
                        'click': function() {
                            login_register.toggle_forgot_password()
                        }
                    },
                    'Cancel': {},
                    'Login': {
                        'class': 'btn-login btn-primary',
                        'click': function() {
                            const app = $('#login_form').data("app");
                            app.submit();
                        }
                    },
                    'Reset Password': {
                        'class': 'btn-reset d-none btn-primary',
                        'click': function() {
                            login_register.forgot_password();
                        }
                    }
                }
            });
            login_form('#login_form');
        },
        'register_dialog': function() {
            modal({
                'title': 'Register for a GenePattern Account',
                'body': `<form id="register_form">
                             <div class="form-group row">
                                 <label for="username" class="col-sm-2 col-sm-3">Username</label>
                                 <div class="col-sm-9">
                                     <input name="username" type="text" class="form-control" placeholder="Username" v-model="username" v-on:keyup.13="submit">
                                 </div>
                             </div>
                             <div class="form-group row">
                                 <label for="password" class="col-sm-2 col-sm-3">Password</label>
                                 <div class="col-sm-9">
                                     <input name="password" type="password" class="form-control" placeholder="Password" v-model="password" v-on:keyup.13="submit">
                                 </div>
                             </div>
                             <div class="form-group row">
                                 <label for="confirm" class="col-sm-2 col-sm-3">Password (again)</label>
                                 <div class="col-sm-9">
                                     <input name="confirm" type="password" class="form-control" placeholder="Password (again)" v-model="password_confirm" v-on:keyup.13="submit">
                                 </div>
                             </div>
                             <div class="form-group row">
                                 <label for="email" class="col-sm-2 col-sm-3">Email</label>
                                 <div class="col-sm-9">
                                     <input name="email" type="email" class="form-control" placeholder="Email Address" v-model="email" v-on:keyup.13="submit">
                                 </div>
                             </div>
                         </form>`,
                'buttons': {
                    'Cancel': {},
                    'Register': {
                        'class': 'btn-primary',
                        'click': function() {
                            const app = $('#register_form').data("app");
                            app.submit();
                        }
                    }
                }
            });
            register_form('#register_form');
        }
    },
    mounted: function() {},
    template: `<ul class="navbar-nav">
                   <li class="nav-item">
                       <a id="login_link" class="nav-link" href="#" v-on:click="login_dialog">Login</a>
                   </li>
                   <li class="nav-item">
                       <a id="register_link" class="nav-link" href="#" v-on:click="register_dialog">Register</a>
                   </li>
               </ul>`
    // template: `<div class="login-register">
    //                <h1>[[ title ]]</h1>
    //                <div class="card login-card">
    //                    <a class="btn btn-lg btn-primary" v-on:click="login_dialog">Login</a>
    //                    <a class="btn btn-lg btn-secondary" v-on:click="register_dialog">Register</a>
    //                </div>
    //            </div>`
});