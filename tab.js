var __extends = this.__extends || function (d, b) {
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var Collection;
(function (Collection) {
    var TabItem = (function (_super) {
        __extends(TabItem, _super);
        function TabItem(attrs, opts) {
            if (typeof attrs === "undefined") { attrs = {
            }; }
            if (typeof opts === "undefined") { opts = {
            }; }
            if(!attrs.model) {
                throw 'content model is required';
            }
                _super.call(this, attrs, opts);
            this.setModel(attrs.model);
        }
        TabItem.prototype.setModel = function (model) {
            var _this = this;
            this.contentModel = model;
            this.id = model.id;
            this.listenTo(model, 'all', function () {
                return _this.trigger.apply(_this, arguments);
            });
        };
        TabItem.prototype.getModel = function () {
            return this.contentModel;
        };
        return TabItem;
    })(Backbone.Model);    
    var Tab = (function (_super) {
        __extends(Tab, _super);
        function Tab(models, options) {
            this.model = TabItem;
                _super.call(this, models, options);
            this.on('select', this.selectModel);
            this.on('close', this.removeModel);
        }
        Tab.prototype.addModel = function (model, opts) {
            if (typeof opts === "undefined") { opts = {
            }; }
            this.add(new TabItem({
                model: model
            }), {
                silent: true
            });
            model.trigger('add', model, this);
            if(opts.select || this.length == 1) {
                model.trigger('select', model);
            }
        };
        Tab.prototype.selectModel = function (model) {
            var wrapperModel = this.get(model.id);
            if(!wrapperModel) {
                return;
            }
            if(this.active) {
                if(this.active.id == wrapperModel.id) {
                    return;
                }
                this.active.getModel().trigger('deselect');
            }
            this.active = wrapperModel;
        };
        Tab.prototype.selectNext = function () {
        };
        Tab.prototype.selectPrev = function () {
        };
        Tab.prototype.removeModel = function (model) {
            var wrapperModel = this.get(model.id);
            if(!wrapperModel) {
                return;
            }
            if(this.active && this.active.id == wrapperModel.id) {
                var alter = this.nextModel(wrapperModel) || this.prevModel(wrapperModel);
                if(alter) {
                    alter.getModel().trigger('select', alter.getModel());
                }
            }
            this.remove(wrapperModel, {
                silent: true
            });
            model.trigger('remove', model, this);
        };
        Tab.prototype.removeCurrent = function () {
            this.removeModel(this.active.getModel());
        };
        Tab.prototype.nextModel = function (wrapperModel) {
            return this.at(this.indexOf(wrapperModel) + 1);
        };
        Tab.prototype.prevModel = function (wrapperModel) {
            return this.at(this.indexOf(wrapperModel) - 1);
        };
        return Tab;
    })(Backbone.Collection);
    Collection.Tab = Tab;    
})(Collection || (Collection = {}));
var View;
(function (View) {
    var TabList = (function (_super) {
        __extends(TabList, _super);
        function TabList(options) {
            this.className = 'tab';
                _super.call(this, options);
            this.collection = new Collection.Tab();
            this.listenTo(this.collection, 'add', this.add);
        }
        TabList.prototype.render = function () {
            this.$el.html('<ul class="tablist"></ul><div class="tabpanels"></div>');
            return this;
        };
        TabList.prototype.append = function (model, opts) {
            this.insertBefore(model, opts);
        };
        TabList.prototype.prepend = function (model, opts) {
            this.insertBefore(model, opts);
        };
        TabList.prototype.insertBefore = function (model, opts) {
            this.collection.addModel(model, opts);
        };
        TabList.prototype.selectByModel = function (model, opts) {
            if (typeof opts === "undefined") { opts = {
            }; }
            model.trigger('select', model);
        };
        TabList.prototype.selectNext = function () {
            this.collection.selectNext();
        };
        TabList.prototype.selectPrev = function () {
            this.collection.selectPrev();
        };
        TabList.prototype.closeByModel = function (model) {
            this.collection.removeModel(model);
        };
        TabList.prototype.closeCurrent = function () {
            this.collection.removeCurrent();
        };
        TabList.prototype.add = function (model, list) {
            this.$('.tablist').append((new TabItem({
                model: model
            })).render().el);
            this.$('.tabpanels').append((new TabPanel({
                model: model
            })).render().el);
        };
        return TabList;
    })(Backbone.View);
    View.TabList = TabList;    
    var TabItem = (function (_super) {
        __extends(TabItem, _super);
        function TabItem(options) {
            var _this = this;
            this.events = {
                'click': function () {
                    return _this.model.trigger('select', _this.model);
                },
                'dblclick': function () {
                    return _this.model.trigger('close', _this.model);
                }
            };
            this.tagName = 'li';
                _super.call(this, options);
            this.listenTo(this.model, 'select', this.selected);
            this.listenTo(this.model, 'deselect', this.deselected);
            this.listenTo(this.model, 'remove', function () {
                return _this.remove();
            });
        }
        TabItem.prototype.render = function () {
            this.$el.html(this.model.get('title'));
            return this;
        };
        TabItem.prototype.selected = function () {
            this.$el.css({
                fontWeight: 'bold'
            });
        };
        TabItem.prototype.deselected = function () {
            this.$el.css({
                fontWeight: 'normal'
            });
        };
        return TabItem;
    })(Backbone.View);
    View.TabItem = TabItem;    
    var TabPanel = (function (_super) {
        __extends(TabPanel, _super);
        function TabPanel(options) {
            var _this = this;
                _super.call(this, options);
            this.listenTo(this.model, 'select', function () {
                return _this.$el.show();
            });
            this.listenTo(this.model, 'deselect', function () {
                return _this.$el.hide();
            });
            this.listenTo(this.model, 'remove', function () {
                return _this.remove();
            });
        }
        TabPanel.prototype.render = function () {
            this.$el.hide().html(this.model.get('body'));
            return this;
        };
        return TabPanel;
    })(Backbone.View);
    View.TabPanel = TabPanel;    
})(View || (View = {}));
var t, m, m2;
$(function () {
    t = (new View.TabList()).render();
    var button = $('<button>add</button>');
    var id = 0;
    button.on('click', function () {
        return t.append(new Backbone.Model({
            id: id++,
            title: 'title' + id,
            body: 'body' + id
        }), {
            select: true
        });
    });
    $('body').append(button);
    $('body').append(t.el);
});
