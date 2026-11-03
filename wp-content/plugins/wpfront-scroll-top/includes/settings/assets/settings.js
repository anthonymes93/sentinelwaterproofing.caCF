(function () {
    'use strict';

    let $ = jQuery;

    let appData = {
        save_disabled: true,
        save_success: false,
        error_message: '',
    };

    let app = Vue.createApp({
        data() {
            return appData;
        },
        created() {
            $(function () {
                $('#scroll-top-content').find('.if-js-closed').removeClass('if-js-closed').addClass('closed');
                postboxes.add_postbox_toggles('wpfront-scroll-top');
            });
        },
        mounted() {
            $('#scroll-top-content').show();
            this.save_disabled = false;
        },
        methods: {
            submit() {
                this.save_disabled = true;

                fetch(this.ajax_url + '?action=wpfront_scroll_top_submit_data', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(this.data)
                })
                .then(response => {
                    if (response.ok) {
                        return response.json();
                    }
                        
                    throw new Error('Network response was not ok.');
                })
                .then(data => {
                    if(!data.success) {
                        throw new Error(data.data);
                    }

                    this.save_success = true;

                    this.data = data.data;
                })
                .catch(error => {
                    this.error_message = error.message;
                })
                .finally(() => {
                    setTimeout(() => {
                        this.save_success = false;
                        this.error_message = '';
                        this.save_disabled = false;
                    }, 3000);
                });
            },

            mediaLibrary() {
                var self = this;

                if (!wp.media.frames.file_frame) {
                    wp.media.frames.file_frame = wp.media({
                        title: appData.labels.media_library_title,
                        multiple: false,
                        'library': {
                            type: 'image'
                        },
                        button: {
                            text: appData.labels.media_library_text
                        }
                    }).on('select', function () {
                        var obj = wp.media.frames.file_frame.state().get('selection').first().toJSON();

                        self.data.custom_url = obj.url;
                        self.data.image = 'custom';
                        self.data.image_alt = self.data.image_alt || obj.alt || obj.title;
                    });
                }

                wp.media.frames.file_frame.open();
            }
        }
    });

    app.use(ElementPlus);

    let load = function (data) {
        Object.assign(appData, data);

        app.component('HelpIcon', {
            props: ['helpText'],
            template: data.templates['help-icon']
        });

        app.component('ColorPicker', {
            props: ['modelValue', 'id'],
            template: data.templates['color-picker']
        });

        app.component('PostsFilterSelection', {
            props: ['modelValue', 'postsList'],
            template: data.templates['posts-filter-selection'],
            computed: {
                selectedPosts: {
                    get() {
                        return this.modelValue.split(',');
                    },
                    set(values) {
                        this.$emit('update:modelValue', values.filter(e => e).join().trim());
                    }
                }
            }
        });

        app.mount('#scroll-top-content');
    };

    load(wpfront_scroll_top_settings);
})();