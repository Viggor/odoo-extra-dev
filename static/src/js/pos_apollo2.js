function openerp_pos_customer(instance, module) { //module is instance.point_of_sale
    var module = instance.point_of_sale;
    var QWeb = instance.web.qweb;
    _t = instance.web._t;

    var round_di = instance.web.round_decimals;
    var round_pr = instance.web.round_precision

    module.CustomernameWidget = module.PosBaseWidget.extend({
        template: 'CustomernameWidget',
        init: function(parent, options) {
            var options = options || {};
            this._super(parent, options);
            this.pos.bind('change:selectedOrder', this.renderElement, this);
        },
        refresh: function() {
            this.renderElement();
        },
        get_name: function() {
            var user;
            customer = this.pos.get('selectedOrder').get_client();
            if (customer) {
                return customer.name;
            } else {
                return "";
            }
        },
        get_first_name: function() {
            var user;
            customer = this.pos.get('selectedOrder').get_client();
            if (customer) {
                return customer.first_name;
            } else {
                return "";
            }
        },
        get_birth_date: function() {
            var user;
            customer = this.pos.get('selectedOrder').get_client();
            if (customer && customer.birth_date != "") {
                birthdate = Date.parse(customer.birth_date);
                return birthdate.toString("d/M/yyyy");
            } else {
                return "";
            }
        },
    });

    module.SelectCustomerPopupWidget = module.PopUpWidget.extend({
        template: 'SelectCustomerPopupWidget',

        start: function() {
            this._super();
            var self = this;
            this.customer_list_widget = new module.CustomerListWidget(this, {
                click_customer_action: function(customer) {
                    this.pos.get('selectedOrder').set_client(customer);
                    //this.pos_widget.customername.refresh();
                    //this.pos_widget.screen_selector.set_current_screen('payment');
                    this.pos_widget.screen_selector.show_popup('edit-customer');
                },
            });

            this.button_create_widget = new module.CustomerListWidget(this, {
                click_create_action: function() {
                    this.pos_widget.screen_selector.show_popup('create-customer');
                }
            });
        },

        show: function() {
            this._super();
            var self = this;
            this.renderElement();

            self.pos_widget.screen_selector.current_screen;

            this.customer_list_widget.replace($('.placeholder-CustomerListWidget'));

            this.$('.button.cancel').off('click').click(function() {
                self.pos.get('selectedOrder').set_client();
                if (self.pos_widget.customername != undefined) {
                    self.pos_widget.customername.refresh();
                }
                var screen_name = self.pos.get('selectedOrder').get_actual_screen();
                self.pos_widget.screen_selector.set_current_screen(screen_name);
            });

            this.$('.button.create').off('click').click(function() {
                self.pos_widget.screen_selector.show_popup('create-customer');
            });

            this.customer_search();
        },

        // Customer search filter
        customer_search: function() {
            var self = this;

            // find all products belonging to the current category
            var customers = this.pos.db.get_all_customers();
            self.pos.get('customers').reset(customers);

            // filter customers according to the search string
            this.$('.customer-searchbox input').keyup(function(event) {
                query = $(this).val().toLowerCase();
                if (query) {
                    var customers = self.pos.db.search_customers(query);
                    self.pos.get('customers').reset(customers);
                    self.$('.customer-search-clear').fadeIn();
                    if (event.keyCode == 13) {
                        var c = null;
                        if (customers.length == 1) {
                            c = self.pos.get('customers').get(customers[0]);
                        }
                        if (c !== null) {
                            self.pos_widget.select_customer_popup.customer_list_widget.click_customer_action(c);
                            self.$('.customer-search-clear').trigger('click');
                        }
                    }
                } else {
                    var customers = self.pos.db.get_all_customers();
                    self.pos.get('customers').reset(customers);
                    self.$('.customer-search-clear').fadeOut();
                }
            });

            this.$('.customer-searchbox input').click(function() {}); //Why ???

            //reset the search when clicking on reset
            this.$('.customer-search-clear').click(function() {
                var customers = self.pos.db.get_all_customers();
                self.pos.get('customers').reset(customers);
                self.$('.customer-searchbox input').val('').focus();
                self.$('.customer-search-clear').fadeOut();
            });
        },

    });

    module.CreateCustomerPopupWidget = module.PopUpWidget.extend({
        template: 'CreateCustomerPopupWidget',

        start: function() {
            this._super();
            var self = this;

        },

        //custom partner creation
        customer_create: function() {
            var self = this;
            var name = this.$('#customer_name input').val();
            var first_name = this.$('#customer_first_name input').val();
            var birth_date = this.$('#customer_birth_date input').val();
            var birth_location = this.$('#customer_birth_location input').val();
            var mobile = this.$('#customer_mobile input').val();
            var phone = this.$('#customer_phone input').val();
            var email = this.$('#customer_email input').val();
            var maiden = this.$('#customer_maiden_name input').val();

            var street = this.$('#customer_street input').val();
            var street2 = this.$('#customer_street2 input').val();
            var zip = this.$('#customer_zip input').val();
            var city = this.$('#customer_city input').val();
            var is_company = this.$('#customer_is_company input').val();

            var Partners = new instance.web.Model('res.partner');
            var customer_id = Partners.call('write_partner_from_pos', [false, name, first_name, phone, mobile, email, birth_date, birth_location, maiden, street, street2, zip, city, is_company], undefined, {
                shadow: true
            })
                .fail(function(clientId) {
                    alert('Erreur: le client n\'a pas pu être crée');
                }).done(function(clientId) {

                    var customer_vals = [{
                        'name': name,
                        'first_name': first_name,
                        'birth_date': birth_date,
                        'birth_location': birth_location,
                        'phone': phone,
                        'email': email,
                        'mobile': mobile,
                        'vat': false,
                        'street': street,
                        'street2': street2,
                        'zip': zip,
                        'city': city,
                        'is_company': is_company,
                        'id': clientId,
                    }];

                    self.pos.db.add_customers(customer_vals);
                    self.pos.get('selectedOrder').set_client(customer_vals[0]);
                    self.pos_widget.customername.refresh();
                    self.pos_widget.payment_screen.update_payment_summary();
                });

        },

        show: function() {
            this._super();
            var self = this;
            this.renderElement();

            this.$('.button.cancel').off('click').click(function() {
                self.pos.get('selectedOrder').set_client();
                var screen_name = self.pos.get('selectedOrder').get_actual_screen();
                self.pos_widget.screen_selector.set_current_screen(screen_name);
            });

            self.$('.button.confirm').off('click').click(function() {
                self.customer_create();
                var screen_name = self.pos.get('selectedOrder').get_actual_screen();
                self.pos_widget.screen_selector.set_current_screen(screen_name);
            });
            this.$('#customer_birth_location').off('change').change(function() {

                if (self.$('#customer_birth_date input').val() != '' && self.$('#customer_birth_location input').val() != '') {
                    self.$('.button.confirm').off('click').click(function() {
                        self.customer_create();
                        var screen_name = self.pos.get('selectedOrder').get_actual_screen();
                        self.pos_widget.screen_selector.set_current_screen(screen_name);
                    });
                };
            });
            this.$('#customer_name input').focus();
        },

    });

    module.EditCustomerPopupWidget = module.PopUpWidget.extend({
        template: 'EditCustomerPopupWidget',

        start: function() {
            this._super();
            var self = this;

        },

        //custom partner creation
        customer_edit: function() {
            var self = this;
            var name = this.$('#customer_name input').val();
            var first_name = this.$('#customer_first_name input').val();
            var birth_date = this.$('#customer_birth_date input').val();
            var birth_location = this.$('#customer_birth_location input').val();
            var mobile = this.$('#customer_mobile input').val();
            var phone = this.$('#customer_phone input').val();
            var email = this.$('#customer_email input').val();
            var maiden = this.$('#customer_maiden_name input').val();
            var id = this.$('#customer_id input').val();

            var street = this.$('#customer_street input').val();
            var street2 = this.$('#customer_street2 input').val();
            var zip = this.$('#customer_zip input').val();
            var city = this.$('#customer_city input').val();
            var is_company = this.$('#customer_is_company input').val();

            var Partners = new instance.web.Model('res.partner');
            var customer_id = Partners.call('write_partner_from_pos', [id, name, first_name, phone, mobile, email, birth_date, birth_location, maiden, street, street2, zip, city, is_company], undefined, {
                shadow: true
            })
                .fail(function(clientId) {
                    alert('Error : customer has not been created nor updated');
                }).done(function(clientId) {

                    var customer_vals = [{
                        'name': name,
                        'first_name': first_name,
                        'birth_date': birth_date,
                        'birth_location': birth_location,
                        'phone': phone,
                        'email': email,
                        'mobile': mobile,
                        'street': street,
                        'street2': street2,
                        'zip': zip,
                        'city': city,
                        'vat': false,
                        'id': clientId,
                    }];

                    self.pos.db.add_customers(customer_vals);
                    self.pos.get('selectedOrder').set_client(customer_vals[0]);
                    self.pos_widget.customername.refresh();
                    self.pos_widget.payment_screen.update_payment_summary();
                });

        },

        show: function() {
            this._super();
            var self = this;
            this.renderElement();

            var client = self.pos.get('selectedOrder').get_client();
            this.$('#customer_name input').val(client['name'] ? client['name'] : '');
            this.$('#customer_first_name input').val(client['first_name'] ? client['first_name'] : '');
            this.$('#customer_birth_date input').val(client['birth_date']);
            this.$('#customer_birth_location input').val(client['birth_location'] ? client['birth_location'] : '');
            this.$('#customer_mobile input').val(client['mobile'] ? client['mobile'] : '');
            this.$('#customer_phone input').val(client['phone'] ? client['phone'] : '');
            this.$('#customer_email input').val(client['email'] ? client['email'] : '');
            this.$('#customer_maiden_name input').val(client['maiden'] ? client['maiden'] : '');
            this.$('#customer_id input').val(client['id']);
            this.$('#customer_street input').val(client['street'] ? client['street'] : '');
            this.$('#customer_street2 input').val(client['street2'] ? client['street2'] : '');
            this.$('#customer_zip input').val(client['zip'] ? client['zip'] : '');
            this.$('#customer_city input').val(client['city'] ? client['city'] : '');

            this.$('.button.cancel').off('click').click(function() {
                self.pos.get('selectedOrder').set_client();
                self.pos_widget.customername.refresh();
                var screen_name = self.pos.get('selectedOrder').get_actual_screen();
                self.pos_widget.screen_selector.set_current_screen(screen_name);
            });

            self.$('.button.confirm').off('click').click(function() {
                self.customer_edit();
                var screen_name = self.pos.get('selectedOrder').get_actual_screen();
                self.pos_widget.screen_selector.set_current_screen(screen_name);
            });

            this.$('#customer_birth_location').off('change').change(function() {

                if (self.$('#customer_birth_date input').val() != false && self.$('#customer_birth_location input').val() != false) {
                    self.$('.button.confirm').off('click').click(function() {
                        self.customer_edit();
                        var screen_name = self.pos.get('selectedOrder').get_actual_screen();
                        self.pos_widget.screen_selector.set_current_screen(screen_name);
                    });
                };
            });
            this.$('#customer_name input').focus();
        },

    });

    module.CustomerWidget = module.PosBaseWidget.extend({
        template: 'CustomerWidget',
        init: function(parent, options) {
            this._super(parent, options);
            this.model = options.model;
            this.click_customer_action = options.click_customer_action;
        },
        renderElement: function() {
            this._super();
            var self = this;
            $("td", this.$el).click(function(e) {
                if (self.click_customer_action) {
                    self.click_customer_action(self.model.toJSON());
                }
            });
        },
        get_birth_date: function() {
            birthdate = Date.parse(this.model.get("birth_date"));
            return birthdate.toString("d/M/yyyy");
        },
    });

    module.CustomerListWidget = module.ScreenWidget.extend({
        template: 'CustomerListWidget',
        init: function(parent, options) {
            var self = this;
            this._super(parent, options);
            this.model = options.model;
            this.customer_list = [];
            this.next_screen = options.next_screen || false;
            this.click_customer_action = options.click_customer_action;

            var customers = self.pos.db.get_all_customers();
            self.pos.get('customers').reset(customers);
            this.pos.get('customers').bind('reset', function() {
                self.renderElement();
            });
        },
        renderElement: function() {
            var self = this;
            this._super();
            this.customer_list = [];

            this.pos.get('customers')
                .chain()
                .map(function(customer) {
                    var customer = new module.CustomerWidget(self, {
                        model: customer,
                        next_screen: 'products',
                        click_customer_action: self.click_customer_action,
                    })
                    self.customer_list.push(customer);
                    return customer;
                })
                .invoke('appendTo', this.$('.customer-list'));

        },
    });

    module.Customer = Backbone.Model.extend({});

    module.CustomerCollection = Backbone.Collection.extend({
        model: module.Customer,
    });


    module.SetMatriculePopupWidget = module.PopUpWidget.extend({
        template: 'SetMatriculePopupWidget',

        start: function() {
            this._super();
            var self = this;


        },

        show: function() {
            this._super();
            var self = this;
            this.renderElement();
            var prod_name = self.pos.get('selectedOrder').get('product_selected').name
            $('#weapon_name', this.$el).html(prod_name);
            this.$('.button.cancel').off('click').click(function() {
                self.pos_widget.screen_selector.set_current_screen('products');
            });

            self.$('.button.validate').off('click').click(function() {
                self.$('#matricule-input').css('background-color', 'LightSalmon');
            });

            this.$('#matricule-input').off('change').change(function() {
                /* Act on the event */
                self.$('.button.validate').off('click').click(function() {
                    product = self.pos.get('selectedOrder').get('product_selected');
                    product.weapon_matricule_number = self.$('.matricule-input input').val();
                    self.pos.get('selectedOrder').addProduct(product);
                    var screen_name = self.pos.get('selectedOrder').get_actual_screen();
                    self.pos.get('selectedOrder').enable_cerfa_print();
                    self.pos_widget.screen_selector.set_current_screen(screen_name);
                });
            });

            this.$('#matricule-input').focus();



        },


    });



    /* ********************* Heritage *********************** */

    module.ProductScreenWidget = module.ScreenWidget.extend({
        template: 'ProductScreenWidget',

        scale_screen: 'scale',
        client_scale_screen: 'scale_invite',
        client_next_screen: 'client_payment',

        show_numpad: true,
        show_leftpane: true,

        start: function() { //FIXME this should work as renderElement... but then the categories aren't properly set. explore why
            var self = this;

            this.product_list_widget = new module.ProductListWidget(this, {
                click_product_action: function(product) {
                    if (product.to_weight && self.pos.config.iface_electronic_scale) {
                        self.pos_widget.screen_selector.set_current_screen(self.cashier_mode ? self.scale_screen : self.client_scale_screen, {
                            product: product
                        });
                    } else {
                        if (product.weapon_category != false) {
                            self.pos.get('selectedOrder').set('product_selected', product);
                            self.pos_widget.screen_selector.show_popup('matricule')
                        } else {
                            self.pos.get('selectedOrder').addProduct(product);


                        }


                    }

                },
                product_list: this.pos.db.get_product_by_category(0)
            });
            this.product_list_widget.replace($('.placeholder-ProductListWidget'));

            this.product_categories_widget = new module.ProductCategoriesWidget(this, {
                product_list_widget: this.product_list_widget,
            });
            this.product_categories_widget.replace($('.placeholder-ProductCategoriesWidget'));
        },

        show: function() {
            this._super();
            var self = this;

            this.product_categories_widget.reset_category();

            this.pos_widget.order_widget.set_editable(true);

            if (this.pos_widget.screen_selector.current_mode === 'client') {
                this.add_action_button({
                    label: _t('Pay'),
                    icon: '/point_of_sale/static/src/img/icons/png48/go-next.png',
                    click: function() {
                        self.pos_widget.screen_selector.set_current_screen(self.client_next_screen);
                    }
                });
            }
        },

        close: function() {
            this._super();

            this.pos_widget.order_widget.set_editable(false);

            if (this.pos.config.iface_vkeyboard && this.pos_widget.onscreen_keyboard) {
                this.pos_widget.onscreen_keyboard.hide();
            }
        },
    });

    // The PosWidget is the main widget that contains all other widgets in the PointOfSale.
    // It is mainly composed of :
    // - a header, containing the list of orders
    // - a leftpane, containing the list of bought products (orderlines) 
    // - a rightpane, containing the screens (see pos_screens.js)
    // - an actionbar on the bottom, containing various action buttons
    // - popups
    // - an onscreen keyboard
    // a screen_selector which controls the switching between screens and the showing/closing of popups

    module.PosWidget = module.PosBaseWidget.extend({
        template: 'PosWidget',
        init: function() {
            this._super(arguments[0], {});

            this.pos = new module.PosModel(this.session, {
                pos_widget: this
            });
            this.pos_widget = this; //So that pos_widget's childs have pos_widget set automatically

            this.numpad_visible = true;
            this.left_action_bar_visible = true;
            this.leftpane_visible = true;
            this.leftpane_width = '440px';
            this.cashier_controls_visible = true;

            FastClick.attach(document.body);

        },

        disable_rubberbanding: function() {
            // prevent the pos body from being scrollable. 
            document.body.addEventListener('touchmove', function(event) {
                var node = event.target;
                while (node) {
                    if (node.classList && node.classList.contains('touch-scrollable')) {
                        return;
                    }
                    node = node.parentNode;
                }
                event.preventDefault();
            });
        },

        start: function() {
            var self = this;
            return self.pos.ready.done(function() {
                $('.oe_tooltip').remove(); // remove tooltip from the start session button

                // remove default webclient handlers that induce click delay
                $(document).off();
                $(window).off();
                $('html').off();
                $('body').off();
                $(self.$el).parent().off();
                $('document').off();
                $('.oe_web_client').off();
                $('.openerp_webclient_container').off();

                self.build_currency_template();
                self.renderElement();

                self.$('.neworder-button').click(function() {
                    self.pos.add_new_order();
                });

                self.$('.deleteorder-button').click(function() {
                    self.pos.delete_current_order();
                });

                //when a new order is created, add an order button widget
                self.pos.get('orders').bind('add', function(new_order) {
                    var new_order_button = new module.OrderButtonWidget(null, {
                        order: new_order,
                        pos: self.pos
                    });
                    new_order_button.appendTo(this.$('.orders'));
                    new_order_button.selectOrder();
                }, self);

                self.pos.add_new_order();

                self.build_widgets();

                if (self.pos.config.iface_big_scrollbars) {
                    self.$el.addClass('big-scrollbars');
                }

                self.screen_selector.set_default_screen();

                self.pos.barcode_reader.connect();

                instance.webclient.set_content_full_screen(true);

                if (!self.pos.session) {
                    self.screen_selector.show_popup('error', 'Sorry, we could not create a user session');
                } else if (!self.pos.config) {
                    self.screen_selector.show_popup('error', 'Sorry, we could not find any PoS Configuration for this session');
                }

                self.$('.loader').animate({
                    opacity: 0
                }, 1500, 'swing', function() {
                    self.$('.loader').addClass('oe_hidden');
                });

                self.pos.flush();

            }).fail(function() { // error when loading models data from the backend
                return new instance.web.Model("ir.model.data").get_func("search_read")([
                    ['name', '=', 'action_pos_session_opening']
                ], ['res_id'])
                    .pipe(_.bind(function(res) {
                        return instance.session.rpc('/web/action/load', {
                            'action_id': res[0]['res_id']
                        })
                            .pipe(_.bind(function(result) {
                                var action = result.result;
                                this.do_action(action);
                            }, this));
                    }, self));
            });
        },
        loading_progress: function(fac) {
            this.$('.loader .loader-feedback').removeClass('oe_hidden');
            this.$('.loader .progress').css({
                'width': '' + Math.floor(fac * 100) + '%'
            });
        },
        loading_message: function(msg, progress) {
            this.$('.loader .loader-feedback').removeClass('oe_hidden');
            this.$('.loader .message').text(msg);
            if (typeof progress !== 'undefined') {
                this.loading_progress(progress);
            }
        },
        loading_skip: function(callback) {
            if (callback) {
                this.$('.loader .loader-feedback').removeClass('oe_hidden');
                this.$('.loader .button.skip').removeClass('oe_hidden');
                this.$('.loader .button.skip').off('click');
                this.$('.loader .button.skip').click(callback);
            } else {
                this.$('.loader .button.skip').addClass('oe_hidden');
            }
        },
        // This method instantiates all the screens, widgets, etc. If you want to add new screens change the
        // startup screen, etc, override this method.
        build_widgets: function() {
            var self = this;

            // --------  Screens ---------

            this.product_screen = new module.ProductScreenWidget(this, {});
            this.product_screen.appendTo(this.$('.screens'));

            this.receipt_screen = new module.ReceiptScreenWidget(this, {});
            this.receipt_screen.appendTo(this.$('.screens'));

            this.payment_screen = new module.PaymentScreenWidget(this, {});
            this.payment_screen.appendTo(this.$('.screens'));

            this.welcome_screen = new module.WelcomeScreenWidget(this, {});
            this.welcome_screen.appendTo(this.$('.screens'));

            this.client_payment_screen = new module.ClientPaymentScreenWidget(this, {});
            this.client_payment_screen.appendTo(this.$('.screens'));

            this.scale_invite_screen = new module.ScaleInviteScreenWidget(this, {});
            this.scale_invite_screen.appendTo(this.$('.screens'));

            this.scale_screen = new module.ScaleScreenWidget(this, {});
            this.scale_screen.appendTo(this.$('.screens'));

            // --------  Popups ---------

            this.help_popup = new module.HelpPopupWidget(this, {});
            this.help_popup.appendTo(this.$el);

            this.error_popup = new module.ErrorPopupWidget(this, {});
            this.error_popup.appendTo(this.$el);

            this.error_product_popup = new module.ProductErrorPopupWidget(this, {});
            this.error_product_popup.appendTo(this.$el);

            this.error_session_popup = new module.ErrorSessionPopupWidget(this, {});
            this.error_session_popup.appendTo(this.$el);

            this.choose_receipt_popup = new module.ChooseReceiptPopupWidget(this, {});
            this.choose_receipt_popup.appendTo(this.$el);

            this.error_negative_price_popup = new module.ErrorNegativePricePopupWidget(this, {});
            this.error_negative_price_popup.appendTo(this.$el);

            this.error_no_client_popup = new module.ErrorNoClientPopupWidget(this, {});
            this.error_no_client_popup.appendTo(this.$el);

            this.error_invoice_transfer_popup = new module.ErrorInvoiceTransferPopupWidget(this, {});
            this.error_invoice_transfer_popup.appendTo(this.$el);

            this.select_customer_popup = new module.SelectCustomerPopupWidget(this, {});
            this.select_customer_popup.appendTo(this.$el);

            this.create_customer_popup = new module.CreateCustomerPopupWidget(this, {});
            this.create_customer_popup.appendTo(this.$el);

            this.edit_customer_popup = new module.EditCustomerPopupWidget(this, {});
            this.edit_customer_popup.appendTo(this.$el);

            this.set_matricule_popup = new module.SetMatriculePopupWidget(this, {});
            this.set_matricule_popup.appendTo(this.$el);

            // --------  Misc ---------

            this.close_button = new module.HeaderButtonWidget(this, {
                label: _t('Close'),
                action: function() {
                    self.close();
                },
            });
            this.close_button.appendTo(this.$('.pos-rightheader'));

            this.notification = new module.SynchNotificationWidget(this, {});
            this.notification.appendTo(this.$('.pos-rightheader'));

            if (this.pos.config.use_proxy) {
                this.proxy_status = new module.ProxyStatusWidget(this, {});
                this.proxy_status.appendTo(this.$('.pos-rightheader'));
            }

            this.username = new module.UsernameWidget(this, {});
            this.username.replace(this.$('.placeholder-UsernameWidget'));

            this.action_bar = new module.ActionBarWidget(this);
            this.action_bar.replace(this.$(".placeholder-RightActionBar"));

            this.left_action_bar = new module.ActionBarWidget(this);
            this.left_action_bar.replace(this.$('.placeholder-LeftActionBar'));

            this.paypad = new module.PaypadWidget(this, {});
            this.paypad.replace(this.$('.placeholder-PaypadWidget'));

            this.numpad = new module.NumpadWidget(this);
            this.numpad.replace(this.$('.placeholder-NumpadWidget'));

            this.order_widget = new module.OrderWidget(this, {});
            this.order_widget.replace(this.$('.placeholder-OrderWidget'));

            this.onscreen_keyboard = new module.OnscreenKeyboardWidget(this, {
                'keyboard_model': 'simple'
            });
            this.onscreen_keyboard.replace(this.$('.placeholder-OnscreenKeyboardWidget'));

            this.client_button = new module.HeaderButtonWidget(this, {
                label: _t('Self-Checkout'),
                action: function() {
                    self.screen_selector.set_user_mode('client');
                },
            });
            this.client_button.appendTo(this.$('.pos-rightheader'));

            this.select_customer_button = new module.HeaderButtonWidget(this, {
                label: 'Choisir client',
                action: function() {
                    self.screen_selector.show_popup('select-customer');
                },
            });
            this.select_customer_button.appendTo(this.$('.pos-rightheader'));

            this.customername = new module.CustomernameWidget(this, {});
            this.customername.appendTo(this.$('.pos-rightheader'));


            // --------  Screen Selector ---------

            this.screen_selector = new module.ScreenSelector({
                pos: this.pos,
                screen_set: {
                    'products': this.product_screen,
                    'payment': this.payment_screen,
                    'client_payment': this.client_payment_screen,
                    'scale_invite': this.scale_invite_screen,
                    'scale': this.scale_screen,
                    'receipt': this.receipt_screen,
                    'welcome': this.welcome_screen,
                },
                popup_set: {
                    'help': this.help_popup,
                    'error': this.error_popup,
                    'error-product': this.error_product_popup,
                    'error-session': this.error_session_popup,
                    'error-negative-price': this.error_negative_price_popup,
                    'choose-receipt': this.choose_receipt_popup,
                    'select-customer': this.select_customer_popup,
                    'error-no-client': this.error_no_client_popup,
                    'error-invoice-transfer': this.error_invoice_transfer_popup,
                    'create-customer': this.create_customer_popup,
                    'matricule': this.set_matricule_popup,
                    'edit-customer': this.edit_customer_popup,
                },
                default_client_screen: 'welcome',
                default_cashier_screen: 'products',
                default_mode: this.pos.config.iface_self_checkout ? 'client' : 'cashier',
            });

            if (this.pos.debug) {
                this.debug_widget = new module.DebugWidget(this);
                this.debug_widget.appendTo(this.$('.pos-content'));
            }

            this.disable_rubberbanding();

        },

        changed_pending_operations: function() {
            var self = this;
            this.synch_notification.on_change_nbr_pending(self.pos.get('nbr_pending_operations').length);
        },
        // shows or hide the numpad and related controls like the paypad.
        set_numpad_visible: function(visible) {
            if (visible !== this.numpad_visible) {
                this.numpad_visible = visible;
                if (visible) {
                    this.set_left_action_bar_visible(false);
                    this.numpad.show();
                    this.paypad.show();
                } else {
                    this.numpad.hide();
                    this.paypad.hide();
                }
            }
        },
        set_left_action_bar_visible: function(visible) {
            if (visible !== this.left_action_bar_visible) {
                this.left_action_bar_visible = visible;
                if (visible) {
                    this.set_numpad_visible(false);
                    this.left_action_bar.show();
                } else {
                    this.left_action_bar.hide();
                }
            }
        },
        //shows or hide the leftpane (contains the list of orderlines, the numpad, the paypad, etc.)
        set_leftpane_visible: function(visible) {
            if (visible !== this.leftpane_visible) {
                this.leftpane_visible = visible;
                if (visible) {
                    this.$('.pos-leftpane').removeClass('oe_hidden').animate({
                        'width': this.leftpane_width
                    }, 500, 'swing');
                    this.$('.pos-rightpane').animate({
                        'left': this.leftpane_width
                    }, 500, 'swing');
                } else {
                    var leftpane = this.$('.pos-leftpane');
                    leftpane.animate({
                        'width': '0px'
                    }, 500, 'swing', function() {
                        leftpane.addClass('oe_hidden');
                    });
                    this.$('.pos-rightpane').animate({
                        'left': '0px'
                    }, 500, 'swing');
                }
            }
        },
        //shows or hide the controls in the PosWidget that are specific to the cashier ( Orders, close button, etc. ) 
        set_cashier_controls_visible: function(visible) {
            if (visible !== this.cashier_controls_visible) {
                this.cashier_controls_visible = visible;
                if (visible) {
                    this.$('.pos-rightheader').removeClass('oe_hidden');
                } else {
                    this.$('.pos-rightheader').addClass('oe_hidden');
                }
            }
        },
        close: function() {
            var self = this;

            function close() {
                return new instance.web.Model("ir.model.data").get_func("search_read")([
                    ['name', '=', 'action_client_pos_menu']
                ], ['res_id']).pipe(function(res) {
                    window.location = '/web#action=' + res[0]['res_id'];
                });
            }

            var draft_order = _.find(self.pos.get('orders').models, function(order) {
                return order.get('orderLines').length !== 0 && order.get('paymentLines').length === 0;
            });
            if (draft_order) {
                if (confirm(_t("Pending orders will be lost.\nAre you sure you want to leave this session?"))) {
                    return close();
                }
            } else {
                return close();
            }
        },
        destroy: function() {
            this.pos.destroy();
            instance.webclient.set_content_full_screen(false);
            this._super();
        }
    });


    module.PosModel = Backbone.Model.extend({
        initialize: function(session, attributes) {
            Backbone.Model.prototype.initialize.call(this, attributes);
            var self = this;
            this.session = session;
            this.flush_mutex = new $.Mutex(); // used to make sure the orders are sent to the server once at time
            this.pos_widget = attributes.pos_widget;

            this.proxy = new module.ProxyDevice(this); // used to communicate to the hardware devices via a local proxy
            this.barcode_reader = new module.BarcodeReader({
                'pos': this,
                proxy: this.proxy
            }); // used to read barcodes
            this.proxy_queue = new module.JobQueue(); // used to prevent parallels communications to the proxy
            this.db = new module.PosDB(); // a local database used to search trough products and categories & store pending orders
            this.debug = jQuery.deparam(jQuery.param.querystring()).debug !== undefined; //debug mode 

            // Business data; loaded from the server at launch
            this.accounting_precision = 2; //TODO
            this.company_logo = null;
            this.company_logo_base64 = '';
            this.currency = null;
            this.shop = null;
            this.company = null;
            this.user = null;
            this.users = [];
            this.partners = [];
            this.cashier = null;
            this.cashregisters = [];
            this.bankstatements = [];
            this.taxes = [];
            this.pos_session = null;
            this.config = null;
            this.units = [];
            this.units_by_id = {};
            this.pricelist = null;
            window.posmodel = this;
            this.partner_list = null;

            // these dynamic attributes can be watched for change by other models or widgets
            this.set({
                'synch': {
                    state: 'connected',
                    pending: 0
                },
                'orders': new module.OrderCollection(),
                'selectedOrder': null,
                'customers': new module.CustomerCollection(),
                'product_selected': null,
            });

            this.bind('change:synch', function(pos, synch) {
                clearTimeout(self.synch_timeout);
                self.synch_timeout = setTimeout(function() {
                    if (synch.state !== 'disconnected' && synch.pending > 0) {
                        self.set('synch', {
                            state: 'disconnected',
                            pending: synch.pending
                        });
                    }
                }, 3000);
            });

            this.get('orders').bind('remove', function(order, _unused_, options) {
                self.on_removed_order(order, options.index, options.reason);
            });

            // We fetch the backend data on the server asynchronously. this is done only when the pos user interface is launched,
            // Any change on this data made on the server is thus not reflected on the point of sale until it is relaunched. 
            // when all the data has loaded, we compute some stuff, and declare the Pos ready to be used. 
            this.ready = this.load_server_data()
                .then(function() {
                    if (self.config.use_proxy) {
                        return self.connect_to_proxy();
                    }
                });

        },

        // releases ressources holds by the model at the end of life of the posmodel
        destroy: function() {
            // FIXME, should wait for flushing, return a deferred to indicate successfull destruction
            // this.flush();
            this.proxy.close();
            this.barcode_reader.disconnect();
            this.barcode_reader.disconnect_from_proxy();
        },
        connect_to_proxy: function() {
            var self = this;
            var done = new $.Deferred();
            this.barcode_reader.disconnect_from_proxy();
            this.pos_widget.loading_message(_t('Connecting to the PosBox'), 0);
            this.pos_widget.loading_skip(function() {
                self.proxy.stop_searching();
            });
            this.proxy.autoconnect({
                force_ip: self.config.proxy_ip || undefined,
                progress: function(prog) {
                    self.pos_widget.loading_progress(prog);
                },
            }).then(function() {
                if (self.config.iface_scan_via_proxy) {
                    self.barcode_reader.connect_to_proxy();
                }
            }).always(function() {
                done.resolve();
            });
            return done;
        },

        // helper function to load data from the server
        fetch: function(model, fields, domain, ctx) {
            this._load_progress = (this._load_progress || 0) + 0.05;
            this.pos_widget.loading_message(_t('Loading') + ' ' + model, this._load_progress);
            return new instance.web.Model(model).query(fields).filter(domain).context(ctx).all()
        },
        // loads all the needed data on the sever. returns a deferred indicating when all the data has loaded. 
        load_server_data: function() {
            var self = this;

            var loaded = self.fetch('res.users', ['name', 'company_id'], [
                ['id', '=', this.session.uid]
            ])
                .then(function(users) {
                    self.user = users[0];

                    return self.fetch('res.company', [
                        'currency_id',
                        'email',
                        'website',
                        'company_registry',
                        'vat',
                        'name',
                        'phone',
                        'partner_id',
                    ], [
                        ['id', '=', users[0].company_id[0]]
                    ], {
                        show_address_only: true
                    });
                }).then(function(companies) {
                    self.company = companies[0];

                    return self.fetch('product.uom', null, null);
                }).then(function(units) {
                    self.units = units;
                    var units_by_id = {};
                    for (var i = 0, len = units.length; i < len; i++) {
                        units_by_id[units[i].id] = units[i];
                    }
                    self.units_by_id = units_by_id;

                    return self.fetch('res.users', ['name', 'ean13'], [
                        ['ean13', '!=', false]
                    ]);
                }).then(function(users) {
                    self.users = users;

                    return self.fetch('res.partner', ['name', 'ean13'], [
                        ['ean13', '!=', false]
                    ]);
                }).then(function(partners) {
                    self.partners = partners;
                    self.set('partner_list', partners);

                    return self.fetch('res.partner', ['name', 'first_name', 'vat', 'email', 'phone', 'mobile', 'birth_date', 'birth_location', 'street', 'street2', 'zip', 'city', 'country_id', 'is_company'], [
                        ['customer', '=', true]
                    ]);
                }).then(function(customers) {
                    self.db.add_customers(customers);

                    return self.fetch('account.tax', ['name', 'amount', 'price_include', 'type']);
                }).then(function(taxes) {
                    self.taxes = taxes;

                    return self.fetch(
                        'pos.session', ['id', 'journal_ids', 'name', 'user_id', 'config_id', 'start_at', 'stop_at'], [
                            ['state', '=', 'opened'],
                            ['user_id', '=', self.session.uid]
                        ]
                    );
                }).then(function(pos_sessions) {
                    self.pos_session = pos_sessions[0];

                    return self.fetch(
                        'pos.config', ['name', 'journal_ids', 'warehouse_id', 'journal_id', 'pricelist_id',
                            'iface_self_checkout', 'iface_led', 'iface_cashdrawer',
                            'iface_payment_terminal', 'iface_electronic_scale', 'iface_barscan',
                            'iface_vkeyboard', 'iface_print_via_proxy', 'iface_scan_via_proxy',
                            'iface_cashdrawer', 'iface_invoicing', 'iface_big_scrollbars',
                            'receipt_header', 'receipt_footer', 'proxy_ip',
                            'state', 'sequence_id', 'session_ids'
                        ], [
                            ['id', '=', self.pos_session.config_id[0]]
                        ]
                    );
                }).then(function(configs) {
                    self.config = configs[0];
                    self.config.use_proxy = self.config.iface_payment_terminal ||
                        self.config.iface_electronic_scale ||
                        self.config.iface_print_via_proxy ||
                        self.config.iface_scan_via_proxy ||
                        self.config.iface_cashdrawer;

                    return self.fetch('stock.warehouse', [], [
                        ['id', '=', self.config.warehouse_id[0]]
                    ]);
                }).then(function(shops) {
                    self.shop = shops[0];

                    return self.fetch('product.pricelist', ['currency_id'], [
                        ['id', '=', self.config.pricelist_id[0]]
                    ]);
                }).then(function(pricelists) {
                    self.pricelist = pricelists[0];

                    return self.fetch('res.currency', ['symbol', 'position', 'rounding', 'accuracy'], [
                        ['id', '=', self.pricelist.currency_id[0]]
                    ]);
                }).then(function(currencies) {
                    self.currency = currencies[0];

                    /*
                    return (new instance.web.Model('decimal.precision')).call('get_precision',[['Account']]);
                }).then(function(precision){
                    self.accounting_precision = precision;
                    console.log("PRECISION",precision);
*/
                    return self.fetch('product.packaging', ['ean', 'product_id']);
                }).then(function(packagings) {
                    self.db.add_packagings(packagings);

                    return self.fetch('product.public.category', ['id', 'name', 'parent_id', 'child_id', 'image'])
                }).then(function(categories) {
                    self.db.add_categories(categories);

                    return self.fetch(
                        'product.product', ['name', 'list_price', 'price', 'public_categ_id', 'taxes_id', 'ean13', 'default_code',
                            'to_weight', 'uom_id', 'uos_id', 'uos_coeff', 'mes_type', 'description_sale', 'description', 'qty_available', 'weapon_category', 'weapon_matricule_number',
                        ], [
                            ['sale_ok', '=', true],
                            ['available_in_pos', '=', true]
                        ], {
                            pricelist: self.pricelist.id
                        } // context for price
                    );
                }).then(function(products) {
                    self.db.add_products(products);

                    return self.fetch(
                        'account.bank.statement', ['account_id', 'currency', 'journal_id', 'state', 'name', 'user_id', 'pos_session_id'], [
                            ['state', '=', 'open'],
                            ['pos_session_id', '=', self.pos_session.id]
                        ]
                    );
                }).then(function(bankstatements) {
                    var journals = [];
                    _.each(bankstatements, function(statement) {
                        journals.push(statement.journal_id[0])
                    });
                    self.bankstatements = bankstatements;
                    return self.fetch('account.journal', undefined, [
                        ['id', 'in', journals]
                    ]);
                }).then(function(journals) {
                    self.journals = journals;

                    // associate the bank statements with their journals. 
                    var bankstatements = self.bankstatements
                    for (var i = 0, ilen = bankstatements.length; i < ilen; i++) {
                        for (var j = 0, jlen = journals.length; j < jlen; j++) {
                            if (bankstatements[i].journal_id[0] === journals[j].id) {
                                bankstatements[i].journal = journals[j];
                                bankstatements[i].self_checkout_payment_method = journals[j].self_checkout_payment_method;
                            }
                        }
                    }
                    self.cashregisters = bankstatements;

                    // Load the company Logo

                    self.company_logo = new Image();
                    self.company_logo.crossOrigin = 'anonymous';
                    var logo_loaded = new $.Deferred();
                    self.company_logo.onload = function() {
                        var img = self.company_logo;
                        var ratio = 1;
                        var targetwidth = 300;
                        var maxheight = 150;
                        if (img.width !== targetwidth) {
                            ratio = targetwidth / img.width;
                        }
                        if (img.height * ratio > maxheight) {
                            ratio = maxheight / img.height;
                        }
                        var width = Math.floor(img.width * ratio);
                        var height = Math.floor(img.height * ratio);
                        var c = document.createElement('canvas');
                        c.width = width;
                        c.height = height
                        var ctx = c.getContext('2d');
                        ctx.drawImage(self.company_logo, 0, 0, width, height);

                        self.company_logo_base64 = c.toDataURL();
                        window.logo64 = self.company_logo_base64;
                        logo_loaded.resolve();
                    };
                    self.company_logo.onerror = function() {
                        logo_loaded.reject();
                    };
                    self.company_logo.src = window.location.origin + '/web/binary/company_logo';

                    return logo_loaded;
                });

            return loaded;
        },

        // this is called when an order is removed from the order collection. It ensures that there is always an existing
        // order and a valid selected order
        on_removed_order: function(removed_order, index, reason) {
            if (reason === 'abandon' && this.get('orders').size() > 0) {
                // when we intentionally remove an unfinished order, and there is another existing one
                this.set({
                    'selectedOrder': this.get('orders').at(index) || this.get('orders').last()
                });
            } else {
                // when the order was automatically removed after completion, 
                // or when we intentionally delete the only concurrent order
                this.add_new_order();
            }
        },

        //creates a new empty order and sets it as the current order
        add_new_order: function() {
            var order = new module.Order({
                pos: this
            });
            this.get('orders').add(order);
            this.set('selectedOrder', order);
        },

        //removes the current order
        delete_current_order: function() {
            this.get('selectedOrder').destroy({
                'reason': 'abandon'
            });
        },

        // saves the order locally and try to send it to the backend. 
        // it returns a deferred that succeeds after having tried to send the order and all the other pending orders.
        push_order: function(order) {
            var self = this;
            this.proxy.log('push_order', order.export_as_JSON());
            var order_id = this.db.add_order(order.export_as_JSON());
            var pushed = new $.Deferred();
            var invoiced = new $.Deferred();

            if (this.pos_widget.pos.get('selectedOrder').get_cerfa_print() == true) {
                if (!order.get_client()) {
                    invoiced.reject('error-no-client');
                    return invoiced;
                }       
            }

            this.set('synch', {
                state: 'connecting',
                pending: self.db.get_orders().length
            });

            this.flush_mutex.exec(function() {

                var done = new $.Deferred(); // holds the mutex

                // send the order to the server
                // we have a 30 seconds timeout on this push.
                // FIXME: if the server takes more than 30 seconds to accept the order,
                // the client will believe it wasn't successfully sent, and very bad
                // things will happen as a duplicate will be sent next time
                // so we must make sure the server detects and ignores duplicated orders

                var transfer = self._flush_order(order_id, {
                    timeout: 30000,
                    to_invoice: false
                });

                transfer.fail(function() {
                    done.reject();
                });

                // on success, get the order id generated by the server
                transfer.pipe(function(order_server_id) {
                    invoiced.resolve();
                    done.resolve();
                });



                return transfer;

                /* var flushed = self._flush_all_orders();

                flushed.always(function(){
                    pushed.resolve();
                });

                return flushed;*/
            });

            return pushed;
        },

        // saves the order locally and try to send it to the backend and make an invoice
        // returns a deferred that succeeds when the order has been posted and successfully generated
        // an invoice. This method can fail in various ways:
        // error-no-client: the order must have an associated partner_id. You can retry to make an invoice once
        //     this error is solved
        // error-transfer: there was a connection error during the transfer. You can retry to make the invoice once
        //     the network connection is up 

        push_and_invoice_order: function(order) {
            var self = this;
            var invoiced = new $.Deferred();

            if (!order.get_client()) {
                invoiced.reject('error-no-client');
                return invoiced;
            }

            var order_id = this.db.add_order(order.export_as_JSON());

            this.set('synch', {
                state: 'connecting',
                pending: self.db.get_orders().length
            });

            this.flush_mutex.exec(function() {
                var done = new $.Deferred(); // holds the mutex

                // send the order to the server
                // we have a 30 seconds timeout on this push.
                // FIXME: if the server takes more than 30 seconds to accept the order,
                // the client will believe it wasn't successfully sent, and very bad
                // things will happen as a duplicate will be sent next time
                // so we must make sure the server detects and ignores duplicated orders

                var transfer = self._flush_order(order_id, {
                    timeout: 30000,
                    to_invoice: true
                });

                transfer.fail(function() {
                    invoiced.reject('error-transfer');
                    done.reject();
                });

                // on success, get the order id generated by the server
                transfer.done(function(order_server_id) {
                    // generate the pdf and download it
                    // self.pos_widget.do_action('point_of_sale.pos_invoice_report', {
                    //     additional_context: {
                    //         active_ids: 123, //self.get('selectedOrder').get_backend_order_id(),
                    //     }
                    // });
                    invoiced.resolve();
                    done.resolve();
                });

                return done;

            });

            return invoiced;
        },

        // attemps to send all pending orders ( stored in the pos_db ) to the server,
        // and remove the successfully sent ones from the db once
        // it has been confirmed that they have been sent correctly.
        flush: function() {
            var self = this;
            var flushed = new $.Deferred();

            this.flush_mutex.exec(function() {
                var done = new $.Deferred();

                self._flush_all_orders()
                    .done(function() {
                        flushed.resolve();
                    })
                    .fail(function() {
                        flushed.reject();
                    })
                    .always(function() {
                        done.resolve();
                    });

                return done;
            });

            return flushed;
        },

        // attempts to send the locally stored order of id 'order_id'
        // the sending is asynchronous and can take some time to decide if it is successful or not
        // it is therefore important to only call this method from inside a mutex
        // this method returns a deferred indicating wether the sending was successful or not
        // there is a timeout parameter which is set to 2 seconds by default. 
        _flush_order: function(order_id, options) {
            return this._flush_all_orders([this.db.get_order(order_id)], options);
        },

        // attempts to send all the locally stored orders. As with _flush_order, it should only be
        // called from within a mutex. 
        // this method returns a deferred that always succeeds when all orders have been tried to be sent,
        // even if none of them could actually be sent. 
        _flush_all_orders: function(order_ids, options) {
            var self = this;
            self.set('synch', {
                state: 'connecting',
                pending: self.get('synch').pending
            });
            return self._save_to_server(self.db.get_orders(), options).done(function() {
                var pending = self.db.get_orders().length;
                self.set('synch', {
                    state: pending ? 'connecting' : 'connected',
                    pending: pending
                });
            });
        },

        // send an array of orders to the server
        // available options:
        // - timeout: timeout for the rpc call in ms
        /*_save_to_server: function(orders, options) {
            if (!orders || !orders.length) {
                var result = $.Deferred();
                result.resolve();
                return result;
            }

            options = options || {};

            var self = this;
            var timeout = typeof options.timeout === 'number' ? options.timeout : 7500 * orders.length;


            // we try to send the order. shadow prevents a spinner if it takes too long. (unless we are sending an invoice,
            // then we want to notify the user that we are waiting on something )
            var posOrderModel = new instance.web.Model('pos.order');
            
            return posOrderModel.call('create_from_ui', [_.map(orders, function(order) {
                        order.to_invoice = options.to_invoice || false;
                        return order;
                    })],
                    undefined, {
                        shadow: !options.to_invoice
                    }
                ).then(function() {
                    _.each(orders, function(order) {
                        self.db.remove_order(order.id);
                    });
                }).fail(function(unused, event) {
                    // prevent an error popup creation by the rpc failure
                    // we want the failure to be silent as we send the orders in the background
                    event.preventDefault();
                    console.error('Failed to send orders:', orders);
                }).done(function(order_ids) {
                    self.get('selectedOrder').set_backend_order_id(order_ids);
                });
        }, */

        _save_to_server: function(orders, options) {
            if (!orders || !orders.length) {
                var result = $.Deferred();
                result.resolve();
                return result;
            }

            options = options || {};

            var self = this;
            var timeout = typeof options.timeout === 'number' ? options.timeout : 7500 * orders.length;
            var clientId = false;
            var cerfa_print = self.get('selectedOrder').get_cerfa_print();

            // we try to send the order. shadow prevents a spinner if it takes too long. (unless we are sending an invoice,
            // then we want to notify the user that we are waiting on something )
            var posOrderModel = new instance.web.Model('pos.order');
            var res = posOrderModel.call('create_from_ui', [_.map(orders, function(order) {
                    order.to_invoice = options.to_invoice || false;
                    return order;
                })],
                undefined, {
                    shadow: !options.to_invoice
                }
            ).then(function() {
                _.each(orders, function(order) {
                    self.db.remove_order(order.id);
                });
            }).fail(function(unused, event) {
                // prevent an error popup creation by the rpc failure
                // we want the failure to be silent as we send the orders in the background
                event.preventDefault();
                console.error('Failed to send orders:', orders);
            }).done(function(res) {

                var Partners = new instance.web.Model('res.partner');
                if (self.get('selectedOrder').get_client() != null) {
                    clientId = self.get('selectedOrder').get_client()['id'];
                }

                Partners.call('return_last_pos_order_id', [clientId], undefined, {
                    shadow: true
                })
                    .fail(function(orderId) {
                        alert('Error : customer has not been created nor updated');
                    }).done(function(orderId) {
                        self.get('selectedOrder').set_backend_order_id([orderId]);
                        // generate the pdf and download it
                        if (self.pos_widget.pos.get('selectedOrder').get_client() != null) {
                            self.pos_widget.do_action('point_of_sale.pos_invoice_report', {
                                additional_context: {
                                    active_ids: [orderId],
                                }
                            });
                        }
                        if (self.get('selectedOrder').get_backend_order_id() != null && cerfa_print == true) {
                            self.pos_widget.do_action('e3z_cerfa.report_cerfa_pos', {
                                additional_context: {
                                    active_ids: self.get('selectedOrder').get_backend_order_id(),
                                }
                            });
                            if (self.config.iface_print_via_proxy) {
                                self.get('selectedOrder').destroy();
                            }

                        }
                        self.pos_widget.pos.get('selectedOrder').destroy(); //finish order and go back to scan screen
                        self.pos_widget.screen_selector.set_current_screen('products');
                    });

            });



            return res;
        },


        scan_product: function(parsed_code) {
            var self = this;
            var selectedOrder = this.get('selectedOrder');
            if (parsed_code.encoding === 'ean13') {
                var product = this.db.get_product_by_ean13(parsed_code.base_code);
            } else if (parsed_code.encoding === 'reference') {
                var product = this.db.get_product_by_reference(parsed_code.code);
            }

            if (!product) {
                return false;
            }

            if (parsed_code.type === 'price') {
                selectedOrder.addProduct(product, {
                    price: parsed_code.value
                });
            } else if (parsed_code.type === 'weight') {
                selectedOrder.addProduct(product, {
                    quantity: parsed_code.value,
                    merge: false
                });
            } else {
                selectedOrder.addProduct(product);
            }
            return true;
        },
    });

    module.PosDB = instance.web.Class.extend({
        name: 'openerp_pos_db', //the prefix of the localstorage data
        limit: 100, // the maximum number of results returned by a search
        init: function(options) {
            options = options || {};
            this.name = options.name || this.name;
            this.limit = options.limit || this.limit;

            //cache the data in memory to avoid roundtrips to the localstorage
            this.cache = {};

            this.product_by_id = {};
            this.product_by_ean13 = {};
            this.product_by_category_id = {};
            this.product_by_reference = {};

            this.category_by_id = {};
            this.root_category_id = 0;
            this.category_products = {};
            this.category_ancestors = {};
            this.category_childs = {};
            this.category_parent = {};
            this.category_search_string = {};
            this.packagings_by_id = {};
            this.packagings_by_product_id = {};
            this.packagings_by_ean13 = {};
            this.customer_list_search_strings = '';
        },
        /* returns the category object from its id. If you pass a list of id as parameters, you get
         * a list of category objects.
         */
        get_category_by_id: function(categ_id) {
            if (categ_id instanceof Array) {
                var list = [];
                for (var i = 0, len = categ_id.length; i < len; i++) {
                    var cat = this.category_by_id[categ_id[i]];
                    if (cat) {
                        list.push(cat);
                    } else {
                        console.error("get_category_by_id: no category has id:", categ_id[i]);
                    }
                }
                return list;
            } else {
                return this.category_by_id[categ_id];
            }
        },
        /* returns a list of the category's child categories ids, or an empty list 
         * if a category has no childs */
        get_category_childs_ids: function(categ_id) {
            return this.category_childs[categ_id] || [];
        },
        /* returns a list of all ancestors (parent, grand-parent, etc) categories ids
         * starting from the root category to the direct parent */
        get_category_ancestors_ids: function(categ_id) {
            return this.category_ancestors[categ_id] || [];
        },
        /* returns the parent category's id of a category, or the root_category_id if no parent.
         * the root category is parent of itself. */
        get_category_parent_id: function(categ_id) {
            return this.category_parent[categ_id] || this.root_category_id;
        },
        /* adds categories definitions to the database. categories is a list of categories objects as
         * returned by the openerp server. Categories must be inserted before the products or the
         * product/ categories association may (will) not work properly */
        add_categories: function(categories) {
            var self = this;
            if (!this.category_by_id[this.root_category_id]) {
                this.category_by_id[this.root_category_id] = {
                    id: this.root_category_id,
                    name: 'Root',
                };
            }
            for (var i = 0, len = categories.length; i < len; i++) {
                this.category_by_id[categories[i].id] = categories[i];
            }
            for (var i = 0, len = categories.length; i < len; i++) {
                var cat = categories[i];
                var parent_id = cat.parent_id[0] || this.root_category_id;
                this.category_parent[cat.id] = cat.parent_id[0];
                if (!this.category_childs[parent_id]) {
                    this.category_childs[parent_id] = [];
                }
                this.category_childs[parent_id].push(cat.id);
            }

            function make_ancestors(cat_id, ancestors) {
                self.category_ancestors[cat_id] = ancestors;

                ancestors = ancestors.slice(0);
                ancestors.push(cat_id);

                var childs = self.category_childs[cat_id] || [];
                for (var i = 0, len = childs.length; i < len; i++) {
                    make_ancestors(childs[i], ancestors);
                }
            }
            make_ancestors(this.root_category_id, []);
        },
        /* loads a record store from the database. returns default if nothing is found */
        load: function(store, deft) {
            if (this.cache[store] !== undefined) {
                return this.cache[store];
            }
            var data = localStorage[this.name + '_' + store];
            if (data !== undefined && data !== "") {
                data = JSON.parse(data);
                this.cache[store] = data;
                return data;
            } else {
                return deft;
            }
        },
        /* saves a record store to the database */
        save: function(store, data) {
            var str_data = JSON.stringify(data);
            localStorage[this.name + '_' + store] = JSON.stringify(data);
            this.cache[store] = data;
        },
        _product_search_string: function(product) {
            var str = '' + product.id + ':' + product.name;
            if (product.ean13) {
                str += '|' + product.ean13;
            }
            if (product.default_code) {
                str += '|' + product.default_code;
            }
            var packagings = this.packagings_by_product_id[product.id] || [];
            for (var i = 0; i < packagings.length; i++) {
                str += '|' + packagings[i].ean;
            }
            return str + '\n';
        },
        add_products: function(products) {
            var stored_categories = this.product_by_category_id;

            if (!products instanceof Array) {
                products = [products];
            }
            for (var i = 0, len = products.length; i < len; i++) {
                var product = products[i];
                var search_string = this._product_search_string(product);
                var categ_id = product.public_categ_id ? product.public_categ_id[0] : this.root_category_id;
                if (!stored_categories[categ_id]) {
                    stored_categories[categ_id] = [];
                }
                stored_categories[categ_id].push(product.id);

                if (this.category_search_string[categ_id] === undefined) {
                    this.category_search_string[categ_id] = '';
                }
                this.category_search_string[categ_id] += search_string;

                var ancestors = this.get_category_ancestors_ids(categ_id) || [];

                for (var j = 0, jlen = ancestors.length; j < jlen; j++) {
                    var ancestor = ancestors[j];
                    if (!stored_categories[ancestor]) {
                        stored_categories[ancestor] = [];
                    }
                    stored_categories[ancestor].push(product.id);

                    if (this.category_search_string[ancestor] === undefined) {
                        this.category_search_string[ancestor] = '';
                    }
                    this.category_search_string[ancestor] += search_string;
                }
                this.product_by_id[product.id] = product;
                if (product.ean13) {
                    this.product_by_ean13[product.ean13] = product;
                }
                if (product.default_code) {
                    this.product_by_reference[product.default_code] = product;
                }
            }
        },
        add_packagings: function(packagings) {
            for (var i = 0, len = packagings.length; i < len; i++) {
                var pack = packagings[i];
                this.packagings_by_id[pack.id] = pack;
                if (!this.packagings_by_product_id[pack.product_id[0]]) {
                    this.packagings_by_product_id[pack.product_id[0]] = [];
                }
                this.packagings_by_product_id[pack.product_id[0]].push(pack);
                if (pack.ean) {
                    this.packagings_by_ean13[pack.ean] = pack;
                }
            }
        },

        _customer_search_string: function(customer) {
            var str = '' + customer.id + ':' + customer.name;
            if (customer.vat) {
                str += '|' + customer.vat;
            }
            if (customer.email) {
                str += '|' + customer.email;
            }
            if (customer.phone) {
                str += '|' + customer.phone;
            }
            if (customer.mobile) {
                str += '|' + customer.mobile;
            }
            return str + '\n';
        },
        add_customers: function(customers) {
            var stored_customers = this.load('customers', {});

            if (!customers instanceof Array) {
                customers = [customers];
            }
            for (var i = 0, len = customers.length; i < len; i++) {
                var c = customers[i];
                this.customer_list_search_strings += this._customer_search_string(c);
                stored_customers[c.id] = c;
            }
            this.save('customers', stored_customers);
        },

        /* removes all the data from the database. TODO : being able to selectively remove data */
        clear: function(stores) {
            for (var i = 0, len = arguments.length; i < len; i++) {
                localStorage.removeItem(this.name + '_' + arguments[i]);
            }
        },
        /* this internal methods returns the count of properties in an object. */
        _count_props: function(obj) {
            var count = 0;
            for (var prop in obj) {
                if (obj.hasOwnProperty(prop)) {
                    count++;
                }
            }
            return count;
        },
        get_product_by_id: function(id) {
            return this.product_by_id[id];
        },
        get_product_by_ean13: function(ean13) {
            if (this.product_by_ean13[ean13]) {
                return this.product_by_ean13[ean13];
            }
            var pack = this.packagings_by_ean13[ean13];
            if (pack) {
                return this.product_by_id[pack.product_id[0]];
            }
            return undefined;
        },
        get_product_by_reference: function(ref) {
            return this.product_by_reference[ref];
        },
        get_product_by_category: function(category_id) {
            var product_ids = this.product_by_category_id[category_id];
            var list = [];
            if (product_ids) {
                for (var i = 0, len = Math.min(product_ids.length, this.limit); i < len; i++) {
                    list.push(this.product_by_id[product_ids[i]]);
                }
            }
            return list;
        },

        get_customer_by_id: function(id) {
            return this.load('customers', {})[id];
        },
        get_all_customers: function() {
            list = [];
            stored_customers = this.load('customers', {});
            for (var i in stored_customers) {
                list.push(stored_customers[i]);
            }

            function dynamicSort(property) {
                var sortOrder = 1;
                if (property[0] === "-") {
                    sortOrder = -1;
                    property = property.substr(1);
                }
                return function(a, b) {
                    var result = (a[property] < b[property]) ? -1 : (a[property] > b[property]) ? 1 : 0;
                    return result * sortOrder;
                }
            }

            function dynamicSortMultiple() {
                /*
                 * save the arguments object as it will be overwritten
                 * note that arguments object is an array-like object
                 * consisting of the names of the properties to sort by
                 */
                var props = arguments;
                return function(obj1, obj2) {
                    var i = 0,
                        result = 0,
                        numberOfProperties = props.length;
                    /* try getting a different result from 0 (equal)
                     * as long as we have extra properties to compare
                     */
                    while (result === 0 && i < numberOfProperties) {
                        result = dynamicSort(props[i])(obj1, obj2);
                        i++;
                    }
                    return result;
                }
            }

            list.sort(dynamicSortMultiple("name", "first_name", "birth_date"));
            return list;
        },

        /* returns a list of products with :
         * - a category that is or is a child of category_id,
         * - a name, package or ean13 containing the query (case insensitive)
         */
        search_product_in_category: function(category_id, query) {
            var re = RegExp("([0-9]+):.*?" + query, "gi");
            var results = [];
            for (var i = 0; i < this.limit; i++) {
                r = re.exec(this.category_search_string[category_id]);
                if (r) {
                    var id = Number(r[1]);
                    results.push(this.get_product_by_id(id));
                } else {
                    break;
                }
            }
            return results;
        },

        /* returns a list of customers with :
         * - a name, TIN, email, or phone/mobile containing the query (case insensitive)
         */
        search_customers: function(query) {
            var re = RegExp("([0-9]+):.*?" + query, "gi");
            var results = [];
            for (var i = 0; i < this.limit; i++) {
                r = re.exec(this.customer_list_search_strings);
                if (r) {
                    var id = Number(r[1]);
                    results.push(this.get_customer_by_id(id));
                } else {
                    break;
                }
            }
            return results;
        },

        add_order: function(order) {
            var order_id = order.uid;
            var orders = this.load('orders', []);

            // if the order was already stored, we overwrite its data
            for (var i = 0, len = orders.length; i < len; i++) {
                if (orders[i].id === order_id) {
                    orders[i].data = order;
                    this.save('orders', orders);
                    return order_id;
                }
            }

            orders.push({
                id: order_id,
                data: order
            });
            this.save('orders', orders);
            return order_id;
        },
        remove_order: function(order_id) {
            var orders = this.load('orders', []);
            orders = _.filter(orders, function(order) {
                return order.id !== order_id;
            });
            this.save('orders', orders);
        },
        get_orders: function() {
            return this.load('orders', []);
        },
        get_order: function(order_id) {
            var orders = this.get_orders();
            for (var i = 0, len = orders.length; i < len; i++) {
                if (orders[i].id === order_id) {
                    return orders[i];
                }
            }
            return undefined;
        },
    });

    module.ScreenWidget = module.PosBaseWidget.extend({

        show_numpad: true,
        show_leftpane: true,

        init: function(parent, options) {
            this._super(parent, options);
            this.hidden = false;
        },

        help_button_action: function() {
            this.pos_widget.screen_selector.show_popup('help');
        },

        barcode_product_screen: 'products', //if defined, this screen will be loaded when a product is scanned
        barcode_product_error_popup: 'error-product', //if defined, this popup will be loaded when there's an error in the popup

        hotkeys_handlers: {},

        // what happens when a product is scanned : 
        // it will add the product to the order and go to barcode_product_screen. Or show barcode_product_error_popup if 
        // there's an error.
        barcode_product_action: function(code) {
            var self = this;
            if (self.pos.scan_product(code)) {
                self.pos.proxy.scan_item_success(code);
                if (self.barcode_product_screen) {
                    self.pos_widget.screen_selector.set_current_screen(self.barcode_product_screen);
                }
            } else {
                self.pos.proxy.scan_item_error_unrecognized(code);
                if (self.barcode_product_error_popup && self.pos_widget.screen_selector.get_user_mode() !== 'cashier') {
                    self.pos_widget.screen_selector.show_popup(self.barcode_product_error_popup);
                }
            }
        },

        // what happens when a cashier id barcode is scanned.
        // the default behavior is the following : 
        // - if there's a user with a matching ean, put it as the active 'cashier', go to cashier mode, and return true
        // - else : do nothing and return false. You probably want to extend this to show and appropriate error popup... 
        barcode_cashier_action: function(code) {
            var users = this.pos.users;
            for (var i = 0, len = users.length; i < len; i++) {
                if (users[i].ean13 === code.code) {
                    this.pos.cashier = users[i];
                    this.pos_widget.username.refresh();
                    this.pos.proxy.cashier_mode_activated();
                    this.pos_widget.screen_selector.set_user_mode('cashier');
                    return true;
                }
            }
            this.pos.proxy.scan_item_error_unrecognized(code);
            return false;
        },

        // what happens when a client id barcode is scanned.
        // the default behavior is the following : 
        // - if there's a user with a matching ean, put it as the active 'client' and return true
        // - else : return false. 
        barcode_client_action: function(code) {
            var partners = this.pos.partners;
            for (var i = 0, len = partners.length; i < len; i++) {
                if (partners[i].ean13 === code.code) {
                    this.pos.get('selectedOrder').set_client(partners[i]);
                    this.pos_widget.username.refresh();
                    this.pos.proxy.scan_item_success(code);
                    return true;
                }
            }
            this.pos.proxy.scan_item_error_unrecognized(code);
            return false;
            //TODO start the transaction
        },

        // what happens when a discount barcode is scanned : the default behavior
        // is to set the discount on the last order.
        barcode_discount_action: function(code) {
            this.pos.proxy.scan_item_success(code);
            var last_orderline = this.pos.get('selectedOrder').getLastOrderline();
            if (last_orderline) {
                last_orderline.set_discount(code.value)
            }
        },

        // shows an action bar on the screen. The actionbar is automatically shown when you add a button
        // with add_action_button()
        show_action_bar: function() {
            this.pos_widget.action_bar.show();
        },

        // hides the action bar. The actionbar is automatically hidden when it is empty
        hide_action_bar: function() {
            this.pos_widget.action_bar.hide();
        },

        // adds a new button to the action bar. The button definition takes three parameters, all optional :
        // - label: the text below the button
        // - icon:  a small icon that will be shown
        // - click: a callback that will be executed when the button is clicked.
        // the method returns a reference to the button widget, and automatically show the actionbar.
        add_action_button: function(button_def) {
            this.show_action_bar();
            return this.pos_widget.action_bar.add_new_button(button_def);
        },

        // this method shows the screen and sets up all the widget related to this screen. Extend this method
        // if you want to alter the behavior of the screen.
        show: function() {
            var self = this;

            this.hidden = false;
            if (this.$el) {
                this.$el.removeClass('oe_hidden');
            }

            if (this.pos_widget.action_bar.get_button_count() > 0) {
                this.show_action_bar();
            } else {
                this.hide_action_bar();
            }

            // we add the help button by default. we do this because the buttons are cleared on each refresh so that
            // the button stay local to each screen
            this.pos_widget.left_action_bar.add_new_button({
                label: _t('Help'),
                icon: '/point_of_sale/static/src/img/icons/png48/help.png',
                click: function() {
                    self.help_button_action();
                },
            });

            var self = this;
            this.cashier_mode = this.pos_widget.screen_selector.get_user_mode() === 'cashier';

            this.pos_widget.set_numpad_visible(this.show_numpad && this.cashier_mode);
            this.pos_widget.set_leftpane_visible(this.show_leftpane);
            this.pos_widget.set_left_action_bar_visible(this.show_leftpane && !this.cashier_mode);
            this.pos_widget.set_cashier_controls_visible(this.cashier_mode);

            if (this.cashier_mode && this.pos.config.iface_self_checkout) {
                this.pos_widget.client_button.show();
            } else {
                this.pos_widget.client_button.hide();
            }
            if (this.cashier_mode) {
                this.pos_widget.close_button.show();
            } else {
                this.pos_widget.close_button.hide();
            }
            this.pos_widget.select_customer_button.show();


            this.pos_widget.username.set_user_mode(this.pos_widget.screen_selector.get_user_mode());

            this.pos.barcode_reader.set_action_callback({
                'cashier': self.barcode_cashier_action ? function(code) {
                    self.barcode_cashier_action(code);
                } : undefined,
                'product': self.barcode_product_action ? function(code) {
                    self.barcode_product_action(code);
                } : undefined,
                'client': self.barcode_client_action ? function(code) {
                    self.barcode_client_action(code);
                } : undefined,
                'discount': self.barcode_discount_action ? function(code) {
                    self.barcode_discount_action(code);
                } : undefined,
            });
        },

        // this method is called when the screen is closed to make place for a new screen. this is a good place
        // to put your cleanup stuff as it is guaranteed that for each show() there is one and only one close()
        close: function() {
            if (this.pos.barcode_reader) {
                this.pos.barcode_reader.reset_action_callbacks();
            }
            this.pos_widget.action_bar.destroy_buttons();
            this.pos_widget.left_action_bar.destroy_buttons();
        },

        // this methods hides the screen. It's not a good place to put your cleanup stuff as it is called on the
        // POS initialization.
        hide: function() {
            this.hidden = true;
            if (this.$el) {
                this.$el.addClass('oe_hidden');
            }
        },

        // we need this because some screens re-render themselves when they are hidden
        // (due to some events, or magic, or both...)  we must make sure they remain hidden.
        // the good solution would probably be to make them not re-render themselves when they
        // are hidden. 
        renderElement: function() {
            this._super();
            if (this.hidden) {
                if (this.$el) {
                    this.$el.addClass('oe_hidden');
                }
            }
        },
    });

    module.PaymentScreenWidget = module.ScreenWidget.extend({
        template: 'PaymentScreenWidget',
        back_screen: 'products',
        next_screen: 'receipt',
        init: function(parent, options) {
            var self = this;
            this._super(parent, options);

            this.pos.bind('change:selectedOrder', function() {
                this.bind_events();
                this.renderElement();
            }, this);

            this.pos_widget.attributes = ['a'];

            this.bind_events();

            this.line_delete_handler = function(event) {
                var node = this;
                while (node && !node.classList.contains('paymentline')) {
                    node = node.parentNode;
                }
                if (node) {
                    self.pos.get('selectedOrder').removePaymentline(node.line)
                }
                event.stopPropagation();
            };

            this.line_change_handler = function(event) {
                var node = this;
                while (node && !node.classList.contains('paymentline')) {
                    node = node.parentNode;
                }
                if (node) {
                    node.line.set_amount(this.value);
                }

            };

            this.line_click_handler = function(event) {
                var node = this;
                while (node && !node.classList.contains('paymentline')) {
                    node = node.parentNode;
                }
                if (node) {
                    self.pos.get('selectedOrder').selectPaymentline(node.line);
                }
            };

            this.hotkey_handler = function(event) {
                if (event.which === 13) {
                    self.validate_order();
                } else if (event.which === 27) {
                    self.back();
                }
            };

        },
        show: function() {
            this._super();
            var self = this;

            this.enable_numpad();
            this.focus_selected_line();

            document.body.addEventListener('keyup', this.hotkey_handler);

            this.add_action_button({
                label: _t('Back'),
                icon: '/point_of_sale/static/src/img/icons/png48/go-previous.png',
                click: function() {
                    self.back();
                },
            });

            this.add_action_button({
                label: 'Choisir client',
                name: 'customer',
                icon: '/e3z_pos_apollo/static/src/img/Person-Male-Light-icon.png',
                click: function() {
                    self.pos_widget.screen_selector.show_popup('select-customer');
                    self.pos.get('selectedOrder').set_actual_screen('payment');
                },
            });

            this.add_action_button({
                label: _t('Validate'),
                name: 'validation',
                icon: '/point_of_sale/static/src/img/icons/png48/validate.png',
                click: function() {
                    self.validate_order({
                        invoice: true
                    });
                },
            });

            if (this.pos.config.iface_invoicing) {
                this.add_action_button({
                    label: 'Invoice',
                    name: 'invoice',
                    icon: '/point_of_sale/static/src/img/icons/png48/invoice.png',
                    click: function() {
                        self.validate_order({
                            invoice: true
                        });
                    },
                });
            }

            if (this.pos.config.iface_cashdrawer) {
                this.add_action_button({
                    label: _t('Cash'),
                    name: 'cashbox',
                    icon: '/point_of_sale/static/src/img/open-cashbox.png',
                    click: function() {
                        self.pos.proxy.open_cashbox();
                    },
                });
            }

            this.update_payment_summary();

        },
        close: function() {
            this._super();
            this.disable_numpad();
            document.body.removeEventListener('keyup', this.hotkey_handler);
        },
        remove_empty_lines: function() {
            var order = this.pos.get('selectedOrder');
            var lines = order.get('paymentLines').models.slice(0);
            for (var i = 0; i < lines.length; i++) {
                var line = lines[i];
                if (line.get_amount() === 0) {
                    order.removePaymentline(line);
                }
            }
        },
        back: function() {
            this.remove_empty_lines();
            this.pos_widget.screen_selector.set_current_screen(this.back_screen);
        },
        bind_events: function() {
            if (this.old_order) {
                this.old_order.unbind(null, null, this);
            }
            var order = this.pos.get('selectedOrder');
            order.bind('change:selected_paymentline', this.focus_selected_line, this);

            this.old_order = order;

            if (this.old_paymentlines) {
                this.old_paymentlines.unbind(null, null, this);
            }
            var paymentlines = order.get('paymentLines');
            paymentlines.bind('add', this.add_paymentline, this);
            paymentlines.bind('change:selected', this.rerender_paymentline, this);
            paymentlines.bind('change:amount', function(line) {
                if (!line.selected && line.node) {
                    line.node.value = line.amount.toFixed(2);
                }
                this.update_payment_summary();
            }, this);
            paymentlines.bind('remove', this.remove_paymentline, this);
            paymentlines.bind('all', this.update_payment_summary, this);

            this.old_paymentlines = paymentlines;

            if (this.old_orderlines) {
                this.old_orderlines.unbind(null, null, this);
            }
            var orderlines = order.get('orderLines');
            orderlines.bind('all', this.update_payment_summary, this);

            this.old_orderlines = orderlines;
        },
        focus_selected_line: function() {
            var line = this.pos.get('selectedOrder').selected_paymentline;
            if (line) {
                var input = line.node.querySelector('input');
                if (!input) {
                    return;
                }
                var value = input.value;
                input.focus();

                if (this.numpad_state) {
                    this.numpad_state.reset();
                }

                if (Number(value) === 0) {
                    input.value = '';
                } else {
                    input.value = value;
                    input.select();
                }
            }
        },
        add_paymentline: function(line) {
            var list_container = this.el.querySelector('.payment-lines');
            list_container.appendChild(this.render_paymentline(line));

            if (this.numpad_state) {
                this.numpad_state.reset();
            }
        },
        render_paymentline: function(line) {
            var el_html = openerp.qweb.render('Paymentline', {
                widget: this,
                line: line
            });
            el_html = _.str.trim(el_html);

            var el_node = document.createElement('tbody');
            el_node.innerHTML = el_html;
            el_node = el_node.childNodes[0];
            el_node.line = line;
            el_node.querySelector('.paymentline-delete')
                .addEventListener('click', this.line_delete_handler);
            el_node.addEventListener('click', this.line_click_handler);
            el_node.querySelector('input')
                .addEventListener('keyup', this.line_change_handler);

            line.node = el_node;

            return el_node;
        },
        rerender_paymentline: function(line) {
            var old_node = line.node;
            var new_node = this.render_paymentline(line);

            old_node.parentNode.replaceChild(new_node, old_node);
        },
        remove_paymentline: function(line) {
            line.node.parentNode.removeChild(line.node);
            line.node = undefined;
        },
        renderElement: function() {
            this._super();

            var paymentlines = this.pos.get('selectedOrder').get('paymentLines').models;
            var list_container = this.el.querySelector('.payment-lines');

            for (var i = 0; i < paymentlines.length; i++) {
                list_container.appendChild(this.render_paymentline(paymentlines[i]));
            }

            this.update_payment_summary();
        },
        update_payment_summary: function() {
            var currentOrder = this.pos.get('selectedOrder');
            var paidTotal = currentOrder.getPaidTotal();
            var dueTotal = currentOrder.getTotalTaxIncluded();
            var remaining = dueTotal > paidTotal ? dueTotal - paidTotal : 0;
            var change = paidTotal > dueTotal ? paidTotal - dueTotal : 0;

            this.$('.payment-due-total').html(this.format_currency(dueTotal));
            this.$('.payment-paid-total').html(this.format_currency(paidTotal));
            this.$('.payment-remaining').html(this.format_currency(remaining));
            this.$('.payment-change').html(this.format_currency(change));
            if (currentOrder.selected_orderline === undefined) {
                remaining = 1; // What is this ? 
            }

            if (this.pos_widget.action_bar) {
                this.pos_widget.action_bar.set_button_disabled('validation', !this.is_paid());
                this.pos_widget.action_bar.set_button_disabled('invoice', !this.is_paid());
                if (this.pos.get('selectedOrder').get_cerfa_print() == true) {
                    this.pos_widget.action_bar.set_button_disabled('validation', !this.customer_selected());
                }
            }
        },

        is_paid: function() {
            var currentOrder = this.pos.get('selectedOrder');
            return (currentOrder.getTotalTaxIncluded() >= 0.000001 && currentOrder.getPaidTotal() + 0.000001 >= currentOrder.getTotalTaxIncluded());

        },
        customer_selected: function() {
            var currentOrder = this.pos.get('selectedOrder');
            if (currentOrder.get_client() != null) {
                return true;
            } else {
                return false;
            }

        },


        validate_order: function(options) {
            var self = this;
            options = options || {};

            var currentOrder = this.pos.get('selectedOrder');

            if (!this.is_paid()) {
                return;
            }

            if (this.pos.config.iface_cashdrawer && this.pos.get('selectedOrder').get('paymentLines').find(function(pl) {
                return pl.cashregister.journal.type === 'cash';
            })) {
                this.pos.proxy.open_cashbox();
            }

            if (options.invoice && this.pos.get('selectedOrder').get_client() != null) {
                // deactivate the validation button while we try to send the order
                this.pos_widget.action_bar.set_button_disabled('validation', true);
                this.pos_widget.action_bar.set_button_disabled('invoice', true);

                var invoiced = this.pos.push_and_invoice_order(currentOrder);

                invoiced.fail(function(error) {
                    if (error === 'error-no-client') {
                        self.pos_widget.screen_selector.show_popup('error-no-client');
                    } else {
                        self.pos_widget.screen_selector.show_popup('error-invoice-transfer');
                    }
                    self.pos_widget.action_bar.set_button_disabled('validation', false);
                    self.pos_widget.action_bar.set_button_disabled('invoice', false);
                });

                invoiced.done(function() {
                    self.pos_widget.action_bar.set_button_disabled('validation', false);
                    self.pos_widget.action_bar.set_button_disabled('invoice', false);
                });

            } else {
                this.pos.push_order(currentOrder);
                if (this.pos.config.iface_print_via_proxy) {
                    this.pos.proxy.print_receipt(currentOrder.export_for_printing());
                    if (this.pos.get('selectedOrder').get_cerfa_print() == false ||  this.pos.get('selectedOrder').get_cerfa_print() == null) {
                        this.pos.get('selectedOrder').destroy(); //finish order and go back to scan screen
                    }
                } else {
                    this.pos_widget.screen_selector.set_current_screen(this.next_screen);
                }
            }

            // hide onscreen (iOS) keyboard 
            setTimeout(function() {
                document.activeElement.blur();
                $("input").blur();
            }, 250);
        },
        enable_numpad: function() {
            this.disable_numpad(); //ensure we don't register the callbacks twice
            this.numpad_state = this.pos_widget.numpad.state;
            if (this.numpad_state) {
                this.numpad_state.reset();
                this.numpad_state.changeMode('payment');
                this.numpad_state.bind('set_value', this.set_value, this);
                this.numpad_state.bind('change:mode', this.set_mode_back_to_payment, this);
            }

        },
        disable_numpad: function() {
            if (this.numpad_state) {
                this.numpad_state.unbind('set_value', this.set_value);
                this.numpad_state.unbind('change:mode', this.set_mode_back_to_payment);
            }
        },
        set_mode_back_to_payment: function() {
            this.numpad_state.set({
                mode: 'payment'
            });
        },
        set_value: function(val) {
            var selected_line = this.pos.get('selectedOrder').selected_paymentline;
            if (selected_line) {
                selected_line.set_amount(val);
                selected_line.node.querySelector('input').value = selected_line.amount.toFixed(2);
            }
        },
    });

    module.Orderline = Backbone.Model.extend({
        initialize: function(attr, options) {
            this.pos = options.pos;
            this.order = options.order;
            this.product = options.product;
            this.price = options.product.price;
            this.quantity = 1;
            this.quantityStr = '1';
            this.discount = 0;
            this.discountStr = '0';
            this.type = 'unit';
            this.selected = false;
            this.matricule_number = false;
            this.actual_qty = 1;
        },
        // sets a discount [0,100]%
        set_discount: function(discount) {
            var disc = Math.min(Math.max(parseFloat(discount) || 0, 0), 100);
            this.discount = disc;
            this.discountStr = '' + disc;
            this.trigger('change', this);
        },
        set_matricule: function(matricule) {
            this.matricule_number = matricule;
        },
        get_matricule: function() {
            return this.matricule_number
        },
        set_actual_qty: function(qty) {
            this.actual_qty = qty;
        },
        get_actual_qty: function() {
            return this.actual_qty;
        },
        // returns the discount [0,100]%
        get_discount: function() {
            return this.discount;
        },
        get_discount_str: function() {
            return this.discountStr;
        },
        get_product_type: function() {
            return this.type;
        },
        // sets the quantity of the product. The quantity will be rounded according to the 
        // product's unity of measure properties. Quantities greater than zero will not get 
        // rounded to zero
        set_quantity: function(quantity) {
            if (quantity === 'remove') {
                this.order.removeOrderline(this);
                return;
            } else {
                var quant = Math.max(parseFloat(quantity) || 0, 0);
                var unit = this.get_unit();
                if (unit) {
                    this.quantity = Math.max(unit.rounding, round_pr(quant, unit.rounding));
                    this.quantityStr = this.quantity.toFixed(Math.max(0, Math.ceil(Math.log(1.0 / unit.rounding) / Math.log(10))));
                } else {
                    this.quantity = quant;
                    this.quantityStr = '' + this.quantity;
                }
                if (this.product.weapon_matricule_number == false) {
                    var actual_qty = this.pos.pos_widget.product_screen.product_list_widget.get_product_stock(this.product.id);
                    if (quantity == "") {
                        this.pos.pos_widget.product_screen.product_list_widget.update_product_stock(this.product.id, this.get_actual_qty() - 1);
                    } else {
                        var diff_qty = this.get_actual_qty() - quantity;
                        this.pos.pos_widget.product_screen.product_list_widget.update_product_stock(this.product.id, diff_qty);
                    }
                    this.pos.pos_widget.product_screen.product_list_widget.renderElement();
                }


            }
            this.trigger('change', this);
            this.set_actual_qty(this.quantity);
        },
        // return the quantity of product
        get_quantity: function() {
            return this.quantity;
        },
        get_quantity_str: function() {
            return this.quantityStr;
        },
        get_quantity_str_with_unit: function() {
            var unit = this.get_unit();
            if (unit && unit.name !== 'Unit(s)') {
                return this.quantityStr + ' ' + unit.name;
            } else {
                return this.quantityStr;
            }
        },
        // return the unit of measure of the product
        get_unit: function() {
            var unit_id = (this.product.uos_id || this.product.uom_id);
            if (!unit_id) {
                return undefined;
            }
            unit_id = unit_id[0];
            if (!this.pos) {
                return undefined;
            }
            return this.pos.units_by_id[unit_id];
        },
        // return the product of this orderline
        get_product: function() {
            return this.product;
        },
        // selects or deselects this orderline
        set_selected: function(selected) {
            this.selected = selected;
            this.trigger('change', this);
        },
        // returns true if this orderline is selected
        is_selected: function() {
            return this.selected;
        },
        // when we add an new orderline we want to merge it with the last line to see reduce the number of items
        // in the orderline. This returns true if it makes sense to merge the two
        can_be_merged_with: function(orderline) {
            if (this.get_product().id !== orderline.get_product().id) { //only orderline of the same product can be merged
                return false;
            } else if (this.get_product_type() !== orderline.get_product_type()) {
                return false;
            } else if (this.get_discount() > 0) { // we don't merge discounted orderlines
                return false;
            } else if (this.price !== orderline.price) {
                return false;
            } else {
                return true;
            }
        },
        merge: function(orderline) {
            this.set_quantity(this.get_quantity() + orderline.get_quantity());
        },
        export_as_JSON: function() {
            return {
                qty: this.get_quantity(),
                price_unit: this.get_unit_price(),
                discount: this.get_discount(),
                product_id: this.get_product().id,
                weapon_matricule: this.get_matricule(),
            };
        },
        //used to create a json of the ticket, to be sent to the printer
        export_for_printing: function() {
            return {
                quantity: this.get_quantity(),
                unit_name: this.get_unit().name,
                price: this.get_unit_price(),
                discount: this.get_discount(),
                product_name: this.get_product().name,
                price_display: this.get_display_price(),
                price_with_tax: this.get_price_with_tax(),
                price_without_tax: this.get_price_without_tax(),
                tax: this.get_tax(),
                product_description: this.get_product().description,
                product_description_sale: this.get_product().description_sale,
            };
        },
        // changes the base price of the product for this orderline
        set_unit_price: function(price) {
            this.price = round_di(parseFloat(price) || 0, 2);
            this.trigger('change', this);
        },
        get_unit_price: function() {
            var rounding = this.pos.currency.rounding;
            return round_pr(this.price, rounding);
        },
        get_display_price: function() {
            var rounding = this.pos.currency.rounding;
            return round_pr(round_pr(this.get_unit_price() * this.get_quantity(), rounding) * (1 - this.get_discount() / 100.0), rounding);
        },
        get_price_without_tax: function() {
            return this.get_all_prices().priceWithoutTax;
        },
        get_price_with_tax: function() {
            return this.get_all_prices().priceWithTax;
        },
        get_tax: function() {
            return this.get_all_prices().tax;
        },
        get_tax_details: function() {
            return this.get_all_prices().taxDetails;
        },
        get_all_prices: function() {
            var self = this;
            var currency_rounding = this.pos.currency.rounding;
            var base = round_pr(this.get_quantity() * this.get_unit_price() * (1.0 - (this.get_discount() / 100.0)), currency_rounding);
            var totalTax = base;
            var totalNoTax = base;

            var product = this.get_product();
            var taxes_ids = product.taxes_id;
            var taxes = self.pos.taxes;
            var taxtotal = 0;
            var taxdetail = {};
            _.each(taxes_ids, function(el) {
                var tax = _.detect(taxes, function(t) {
                    return t.id === el;
                });
                if (tax.price_include) {
                    var tmp;
                    if (tax.type === "percent") {
                        tmp = base - round_pr(base / (1 + tax.amount), currency_rounding);
                    } else if (tax.type === "fixed") {
                        tmp = round_pr(tax.amount * self.get_quantity(), currency_rounding);
                    } else {
                        throw "This type of tax is not supported by the point of sale: " + tax.type;
                    }
                    tmp = round_pr(tmp, currency_rounding);
                    taxtotal += tmp;
                    totalNoTax -= tmp;
                    taxdetail[tax.id] = tmp;
                } else {
                    var tmp;
                    if (tax.type === "percent") {
                        tmp = tax.amount * base;
                    } else if (tax.type === "fixed") {
                        tmp = tax.amount * self.get_quantity();
                    } else {
                        throw "This type of tax is not supported by the point of sale: " + tax.type;
                    }
                    tmp = round_pr(tmp, currency_rounding);
                    taxtotal += tmp;
                    totalTax += tmp;
                    taxdetail[tax.id] = tmp;
                }
            });
            return {
                "priceWithTax": totalTax,
                "priceWithoutTax": totalNoTax,
                "tax": taxtotal,
                "taxDetails": taxdetail,
            };
        },
    });

    module.Order = Backbone.Model.extend({
        initialize: function(attributes) {
            Backbone.Model.prototype.initialize.apply(this, arguments);
            this.uid = this.generateUniqueId();
            this.set({
                creationDate: new Date(),
                orderLines: new module.OrderlineCollection(),
                paymentLines: new module.PaymentlineCollection(),
                name: "Order " + this.uid,
                client: null,
                backend_order_id: null,
                actual_screen: null,
                cerfa_print: null,
            });
            this.pos = attributes.pos;
            this.selected_orderline = undefined;
            this.selected_paymentline = undefined;
            this.screen_data = {}; // see ScreenSelector
            this.receipt_type = 'receipt'; // 'receipt' || 'invoice'
            this.product_list_widget = null;
            return this;
        },
        generateUniqueId: function() {
            return new Date().getTime();
        },
        addProduct: function(product, options) {
            options = options || {};
            var attr = JSON.parse(JSON.stringify(product));
            attr.pos = this.pos;
            attr.order = this;
            var line = new module.Orderline({}, {
                pos: this.pos,
                order: this,
                product: product
            });

            line.set_matricule(product.weapon_matricule_number);

            if (options.quantity !== undefined) {
                line.set_quantity(options.quantity);
            }
            if (options.price !== undefined) {
                line.set_unit_price(options.price);
            }

            var last_orderline = this.getLastOrderline();
            if (last_orderline && last_orderline.can_be_merged_with(line) && options.merge !== false && product.weapon_matricule_number == false) {
                last_orderline.merge(line);
            } else {
                this.pos.pos_widget.product_screen.product_list_widget.update_product_stock(line.product.id, -1);
                this.get('orderLines').add(line);
            }
            this.selectLine(this.getLastOrderline());
        },
        removeOrderline: function(line) {

            // this.pos.pos_widget.product_screen.product_list_widget.product_list
            this.pos.pos_widget.product_screen.product_list_widget.update_product_stock(line.product.id, line.quantity);
            this.pos.pos_widget.product_screen.product_list_widget.renderElement();


            this.get('orderLines').remove(line);
            this.selectLine(this.getLastOrderline());
        },
        getLastOrderline: function() {
            return this.get('orderLines').at(this.get('orderLines').length - 1);
        },
        addPaymentline: function(cashregister) {
            var paymentLines = this.get('paymentLines');
            var newPaymentline = new module.Paymentline({}, {
                cashregister: cashregister
            });
            if (cashregister.journal.type !== 'cash') {
                newPaymentline.set_amount(Math.max(this.getDueLeft(), 0));
            }
            paymentLines.add(newPaymentline);
            this.selectPaymentline(newPaymentline);

        },
        removePaymentline: function(line) {
            if (this.selected_paymentline === line) {
                this.selectPaymentline(undefined);
            }
            this.get('paymentLines').remove(line);
        },
        getName: function() {
            return this.get('name');
        },
        getSubtotal: function() {
            return (this.get('orderLines')).reduce((function(sum, orderLine) {
                return sum + orderLine.get_display_price();
            }), 0);
        },
        getTotalTaxIncluded: function() {
            return (this.get('orderLines')).reduce((function(sum, orderLine) {
                return sum + orderLine.get_price_with_tax();
            }), 0);
        },
        getDiscountTotal: function() {
            return (this.get('orderLines')).reduce((function(sum, orderLine) {
                return sum + (orderLine.get_unit_price() * (orderLine.get_discount() / 100) * orderLine.get_quantity());
            }), 0);
        },
        getTotalTaxExcluded: function() {
            return (this.get('orderLines')).reduce((function(sum, orderLine) {
                return sum + orderLine.get_price_without_tax();
            }), 0);
        },
        getTax: function() {
            return (this.get('orderLines')).reduce((function(sum, orderLine) {
                return sum + orderLine.get_tax();
            }), 0);
        },
        getTaxDetails: function() {
            var details = {};
            var fulldetails = [];
            var taxes_by_id = {};

            for (var i = 0; i < this.pos.taxes.length; i++) {
                taxes_by_id[this.pos.taxes[i].id] = this.pos.taxes[i];
            }

            this.get('orderLines').each(function(line) {
                var ldetails = line.get_tax_details();
                for (var id in ldetails) {
                    if (ldetails.hasOwnProperty(id)) {
                        details[id] = (details[id] || 0) + ldetails[id];
                    }
                }
            });

            for (var id in details) {
                if (details.hasOwnProperty(id)) {
                    fulldetails.push({
                        amount: details[id],
                        tax: taxes_by_id[id]
                    });
                }
            }

            return fulldetails;
        },
        getPaidTotal: function() {
            return (this.get('paymentLines')).reduce((function(sum, paymentLine) {
                return sum + paymentLine.get_amount();
            }), 0);
        },
        getChange: function() {
            return this.getPaidTotal() - this.getTotalTaxIncluded();
        },
        getDueLeft: function() {
            return this.getTotalTaxIncluded() - this.getPaidTotal();
        },
        // sets the type of receipt 'receipt'(default) or 'invoice'
        set_receipt_type: function(type) {
            this.receipt_type = type;
        },
        get_receipt_type: function() {
            return this.receipt_type;
        },
        // the client related to the current order.
        set_client: function(client) {
            this.set('client', client);
        },
        get_client: function() {
            return this.get('client');
        },
        set_backend_order_id: function(order_id) {
            this.set('backend_order_id', order_id);
        },
        get_backend_order_id: function() {
            return this.get('backend_order_id');
        },
        set_actual_screen: function(screen_name) {
            this.set('actual_screen', screen_name);
        },
        get_actual_screen: function() {
            return this.get('actual_sceen');
        },
        enable_cerfa_print: function() {
            this.set('cerfa_print', true);
        },
        disable_cerfa_print: function() {
            this.set('cerfa_print', false);
        },
        get_cerfa_print: function() {
            return this.get('cerfa_print');
        },
        get_client_name: function() {
            var client = this.get('client');
            return client ? client.name : "";
        },
        // the order also stores the screen status, as the PoS supports
        // different active screens per order. This method is used to
        // store the screen status.
        set_screen_data: function(key, value) {
            if (arguments.length === 2) {
                this.screen_data[key] = value;
            } else if (arguments.length === 1) {
                for (key in arguments[0]) {
                    this.screen_data[key] = arguments[0][key];
                }
            }
        },
        //see set_screen_data
        get_screen_data: function(key) {
            return this.screen_data[key];
        },
        // exports a JSON for receipt printing
        export_for_printing: function() {
            var orderlines = [];
            this.get('orderLines').each(function(orderline) {
                orderlines.push(orderline.export_for_printing());
            });

            var paymentlines = [];
            this.get('paymentLines').each(function(paymentline) {
                paymentlines.push(paymentline.export_for_printing());
            });
            var client = this.get('client');
            var cashier = this.pos.cashier || this.pos.user;
            var company = this.pos.company;
            var shop = this.pos.shop;
            var date = new Date();

            return {
                orderlines: orderlines,
                paymentlines: paymentlines,
                subtotal: this.getSubtotal(),
                total_with_tax: this.getTotalTaxIncluded(),
                total_without_tax: this.getTotalTaxExcluded(),
                total_tax: this.getTax(),
                total_paid: this.getPaidTotal(),
                total_discount: this.getDiscountTotal(),
                tax_details: this.getTaxDetails(),
                change: this.getChange(),
                name: this.getName(),
                client: client ? client.name : null,
                invoice_id: null, //TODO
                cashier: cashier ? cashier.name : null,
                header: this.pos.config.receipt_header || '',
                footer: this.pos.config.receipt_footer || '',
                precision: {
                    price: 2,
                    money: 2,
                    quantity: 3,
                },
                date: {
                    year: date.getFullYear(),
                    month: date.getMonth(),
                    date: date.getDate(), // day of the month 
                    day: date.getDay(), // day of the week 
                    hour: date.getHours(),
                    minute: date.getMinutes(),
                    isostring: date.toISOString(),
                },
                company: {
                    email: company.email,
                    website: company.website,
                    company_registry: company.company_registry,
                    contact_address: company.partner_id[1],
                    vat: company.vat,
                    name: company.name,
                    phone: company.phone,
                    logo: this.pos.company_logo_base64,
                },
                shop: {
                    name: shop.name,
                },
                currency: this.pos.currency,
            };
        },
        export_as_JSON: function() {
            var orderLines, paymentLines;
            orderLines = [];
            (this.get('orderLines')).each(_.bind(function(item) {
                return orderLines.push([0, 0, item.export_as_JSON()]);
            }, this));
            paymentLines = [];
            (this.get('paymentLines')).each(_.bind(function(item) {
                return paymentLines.push([0, 0, item.export_as_JSON()]);
            }, this));
            return {
                name: this.getName(),
                amount_paid: this.getPaidTotal(),
                amount_total: this.getTotalTaxIncluded(),
                amount_tax: this.getTax(),
                amount_return: this.getChange(),
                lines: orderLines,
                statement_ids: paymentLines,
                pos_session_id: this.pos.pos_session.id,
                partner_id: this.get_client() ? this.get_client().id : false,
                user_id: this.pos.cashier ? this.pos.cashier.id : this.pos.user.id,
                uid: this.uid,
            };
        },
        getSelectedLine: function() {
            return this.selected_orderline;
        },
        selectLine: function(line) {
            if (line) {
                if (line !== this.selected_orderline) {
                    if (this.selected_orderline) {
                        this.selected_orderline.set_selected(false);
                    }
                    this.selected_orderline = line;
                    this.selected_orderline.set_selected(true);
                }
            } else {
                this.selected_orderline = undefined;
            }
        },
        deselectLine: function() {
            if (this.selected_orderline) {
                this.selected_orderline.set_selected(false);
                this.selected_orderline = undefined;
            }
        },
        selectPaymentline: function(line) {
            if (line !== this.selected_paymentline) {
                if (this.selected_paymentline) {
                    this.selected_paymentline.set_selected(false);
                }
                this.selected_paymentline = line;
                if (this.selected_paymentline) {
                    this.selected_paymentline.set_selected(true);
                }
                this.trigger('change:selected_paymentline', this.selected_paymentline);
            }
        },
    });

    module.ScreenSelector = instance.web.Class.extend({
        init: function(options) {
            this.pos = options.pos;

            this.screen_set = options.screen_set || {};

            this.popup_set = options.popup_set || {};

            this.default_client_screen = options.default_client_screen;
            this.default_cashier_screen = options.default_cashier_screen;

            this.current_popup = null;

            this.current_mode = options.default_mode || 'client';

            this.current_screen = null;

            for (screen_name in this.screen_set) {
                this.screen_set[screen_name].hide();
            }

            for (popup_name in this.popup_set) {
                this.popup_set[popup_name].hide();
            }

            this.selected_order = this.pos.get('selectedOrder');
            this.selected_order.set_screen_data({
                client_screen: this.default_client_screen,
                cashier_screen: this.default_cashier_screen,
            });

            this.pos.bind('change:selectedOrder', this.load_saved_screen, this);
        },
        add_screen: function(screen_name, screen) {
            screen.hide();
            this.screen_set[screen_name] = screen;
            return this;
        },
        show_popup: function(name) {
            if (this.current_popup) {
                this.close_popup();
            }
            this.current_popup = this.popup_set[name];
            this.current_popup.show();
        },
        close_popup: function() {
            if (this.current_popup) {
                this.current_popup.close();
                this.current_popup.hide();
                this.current_popup = null;
            }
        },
        load_saved_screen: function() {
            this.close_popup();

            var selectedOrder = this.pos.get('selectedOrder');

            if (this.current_mode === 'client') {
                this.set_current_screen(selectedOrder.get_screen_data('client_screen') || this.default_client_screen, null, 'refresh');
            } else if (this.current_mode === 'cashier') {
                this.set_current_screen(selectedOrder.get_screen_data('cashier_screen') || this.default_cashier_screen, null, 'refresh');
            }
            this.selected_order = selectedOrder;
        },
        set_user_mode: function(user_mode) {
            if (user_mode !== this.current_mode) {
                this.close_popup();
                this.current_mode = user_mode;
                this.load_saved_screen();
            }
        },
        get_user_mode: function() {
            return this.current_mode;
        },
        set_current_screen: function(screen_name, params, refresh) {
            var screen = this.screen_set[screen_name];
            if (!screen) {
                console.error("ERROR: set_current_screen(" + screen_name + ") : screen not found");
            }

            this.close_popup();
            var selectedOrder = this.pos.get('selectedOrder');
            if (this.current_mode === 'client') {
                selectedOrder.set_screen_data('client_screen', screen_name);
                if (params) {
                    selectedOrder.set_screen_data('client_screen_params', params);
                }
            } else {
                selectedOrder.set_screen_data('cashier_screen', screen_name);
                if (params) {
                    selectedOrder.set_screen_data('cashier_screen_params', params);
                }
            }

            if (screen && (refresh || screen !== this.current_screen)) {
                if (this.current_screen) {
                    this.current_screen.close();
                    this.current_screen.hide();
                }
                this.current_screen = screen;
                this.current_screen.show();
            }
            selectedOrder.set_actual_screen(screen_name);
        },
        get_current_screen_param: function(param) {
            var selected_order = this.pos.get('selectedOrder');
            if (this.current_mode === 'client') {
                var params = selected_order.get_screen_data('client_screen_params');
            } else {
                var params = selected_order.get_screen_data('cashier_screen_params');
            }
            if (params) {
                return params[param];
            } else {
                return undefined;
            }
        },
        set_default_screen: function() {
            this.set_current_screen(this.current_mode === 'client' ? this.default_client_screen : this.default_cashier_screen);
        },
    });

    module.ProductListWidget = module.PosBaseWidget.extend({
        template: 'ProductListWidget',
        init: function(parent, options) {
            var self = this;
            this._super(parent, options);
            this.model = options.model;
            this.productwidgets = [];
            this.weight = options.weight || 0;
            this.show_scale = options.show_scale || false;
            this.next_screen = options.next_screen || false;
            this.product_list = options.product_list || [];
            this.product_cache = new module.DomCache();

            this.click_product_handler = function(event) {
                var product = self.pos.db.get_product_by_id(this.dataset['productId']);
                options.click_product_action(product);
                // HACK ajout de la modification de la qty available et rechargement de l'affichage
                for (var i = 0, len = self.product_list.length - 1; i < len; i++) {
                    /*if (self.product_list[i].name == product.name) {
                        self.product_list[i].qty_available = self.product_list[i].qty_available - 1;
                    }*/



                }
                //self.update_product_stock(product.id, -1);
                self.renderElement();
            };


        },
        set_product_list: function(product_list) {
            this.product_list = product_list;
            this.renderElement();
        },
        get_product_image_url: function(product) {
            return window.location.origin + '/web/binary/image?model=product.product&field=image_medium&id=' + product.id;
        },
        replace: function($target) {
            this.renderElement();
            var target = $target[0];
            target.parentNode.replaceChild(this.el, target);
        },
        update_product_stock: function(pid, qty) {
            var product = $.grep(this.product_list, function(n, i) {
                if (n['id'] == pid) {
                    return n;
                }

            });

            var index = this.product_list.map(function(el) {
                return el.id;
            }).indexOf(product[0].id);

            this.product_list[index].qty_available = this.product_list[index].qty_available + qty;

        },
        get_product_stock: function(pid) {
            var product = $.grep(this.product_list, function(n, i) {
                if (n['id'] == pid) {
                    return n;
                }

            });

            var index = this.product_list.map(function(el) {
                return el.id;
            }).indexOf(product[0].id);

            return this.product_list[index].qty_available;
        },
        render_product: function(product) {
            //HACK desactivation du cache de la vue qui bloque le rafraichissement des produits.
            // var cached = this.product_cache.get_node(product.id);
            // if (!cached) {
            var image_url = this.get_product_image_url(product);
            var product_html = QWeb.render('Product', {
                widget: this,
                product: product,
                image_url: this.get_product_image_url(product),
            });
            var product_node = document.createElement('div');
            product_node.innerHTML = product_html;
            product_node = product_node.childNodes[1];
            this.product_cache.cache_node(product.id, product_node);
            return product_node;
            // }
            // return cached;
        },

        renderElement: function() {
            var self = this;

            // this._super()
            var el_str = openerp.qweb.render(this.template, {
                widget: this
            });
            var el_node = document.createElement('div');
            el_node.innerHTML = el_str;
            el_node = el_node.childNodes[1];

            if (this.el && this.el.parentNode) {
                this.el.parentNode.replaceChild(el_node, this.el);
            }
            this.el = el_node;

            var list_container = el_node.querySelector('.product-list');
            for (var i = 0, len = this.product_list.length; i < len; i++) {
                var product_node = this.render_product(this.product_list[i]);
                product_node.addEventListener('click', this.click_product_handler);
                list_container.appendChild(product_node);
            };
        },
    });

}