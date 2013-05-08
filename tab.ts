/// <reference path="d.ts/DefinitelyTyped/jquery/jquery.d.ts" />
/// <reference path="d.ts/DefinitelyTyped/underscore/underscore.d.ts" />
/// <reference path="d.ts/DefinitelyTyped/backbone/backbone.d.ts" />

module Collection {

    // Backbone.Model は複数の Backbone.Collection に紐づくことが
    // できないため、wrapper としての model を挟む.
    // Collection.Tab の内部でのみ利用し、外部には出さない
    class TabItem extends Backbone.Model {
        private contentModel: Backbone.Model;
        constructor(attrs:any = {}, opts:any = {}) {
            if (!attrs.model) throw 'content model is required';
            super(attrs, opts);
            this.setModel(attrs.model);
        }
        setModel(model: Backbone.Model) {
            this.contentModel = model;
            this.id = model.id;
            this.listenTo(model, 'all', () => this.trigger.apply(this, arguments));
        }
        getModel() : Backbone.Model {
            return this.contentModel;
        }
    }

    export class Tab extends Backbone.Collection {
        private active: TabItem;
        constructor(models?, options?) {
            this.model = TabItem;
            super(models, options);
            this.on('select', this.selectModel);
            this.on('close', this.removeModel);
        }
        addModel(model: Backbone.Model, opts: any = {}) {
            this.add(new TabItem({model:model}), {silent:true});
            model.trigger('add', model, this);
            if (opts.select || this.length == 1) model.trigger('select', model);
        }
        selectModel(model: Backbone.Model) {
            var wrapperModel = <TabItem>this.get(model.id);
            if (!wrapperModel) return;
            if (this.active) {
                if (this.active.id == wrapperModel.id) return;
                this.active.getModel().trigger('deselect');
            }
            this.active = wrapperModel;
        }
        selectNext() {
            // var active = this.active || this.at(0);
            // if (!active) return;
            // var next = this.nextModel(active).getModel();
            // next.trigger('select', next);
        }
        selectPrev() {
            // var active = this.active || this.at(0);
            // if (!active) return;
            // var prev = this.prevModel(active).getModel();
            // prev.trigger('select', prev);
        }
        removeModel(model: Backbone.Model) {
            var wrapperModel = this.get(model.id);
            if (!wrapperModel) return;
            if (this.active && this.active.id == wrapperModel.id) {
                var alter = this.nextModel(wrapperModel) || this.prevModel(wrapperModel);
                if (alter) alter.getModel().trigger('select', alter.getModel());
            }
            this.remove(wrapperModel, {silent:true});
            model.trigger('remove', model, this);
        }
        removeCurrent() {
            this.removeModel(this.active);
        }
        private nextModel(wrapperModel: Backbone.Model) {
            return <TabItem>this.at(this.indexOf(wrapperModel) + 1);
        }
        private prevModel(wrapperModel: Backbone.Model) {
            return <TabItem>this.at(this.indexOf(wrapperModel) - 1);
        }
    }
}

module View {
    export class TabList extends Backbone.View {
        collection: Collection.Tab;
        constructor (options?: Backbone.ViewOptions) {
            super(options);
            this.collection = new Collection.Tab();
            this.listenTo(this.collection, 'add', this.add);
        }
        append(model: Backbone.Model, opts?: any) { // XXX
            this.insertBefore(model, opts);
        }
        prepend(model: Backbone.Model, opts?: any) { // XXX
            this.insertBefore(model, opts);
        }
        insertBefore(model: Backbone.Model, opts?: any) { // XXX
            this.collection.addModel(model, opts);
        }
        selectByModel(model: Backbone.Model, opts: any = {}) {
            model.trigger('select', model);
        }
        selectNext() {
            this.collection.selectNext();
        }
        selectPrev() {
            this.collection.selectPrev();
        }
        // XXX sort
        closeByModel(model: Backbone.Model) {
            this.collection.removeModel(model);
        }
        closeCurrent() {
            this.collection.removeCurrent();
        }
        // model event handler (view method)
        private add(model: Backbone.Model, list: Collection.Tab) {
            this.$el.append((new TabItem({model: model})).render().el);
            this.$el.after((new TabPanel({model: model})).render().el);
        }
    }

    export class TabItem extends Backbone.View {
        constructor (options?: Backbone.ViewOptions) {
            this.events = {
                'click' : () => this.model.trigger('select', this.model),
                'dblclick' : () => this.model.trigger('close', this.model)
            };
            super(options);
            this.listenTo(this.model, 'select', this.selected);
            this.listenTo(this.model, 'deselect', this.deselected);
            this.listenTo(this.model, 'remove', () => this.remove());
        }
        render() {
            this.$el.html(this.model.get('title'));
            return this;
        }
        // view method
        private selected() { this.$el.css({fontWeight:'bold'}); }
        private deselected() { this.$el.css({fontWeight:'normal'}); }
    }

    export class TabPanel extends Backbone.View {
        constructor (options?: Backbone.ViewOptions) {
            super(options);
            this.listenTo(this.model, 'select', () => this.$el.show());
            this.listenTo(this.model, 'deselect', () => this.$el.hide());
            this.listenTo(this.model, 'remove', () => this.remove());
        }
        render() : TabPanel {
            this.$el.hide().html(this.model.get('body'));
            return this;
        }
    }
}

var t, m, m2;
$(() => {
    t = (new View.TabList()).render();
    var button = $('<button>add</button>');
    var id = 0;
    button.on('click', () => t.append(new Backbone.Model({
        id:id++,title:'title' + id,body:'body' + id
    }), {select:true}));
    $('body').append(button);
    $('body').append(t.el);
    // m  = new Backbone.Model({id:id++,title:'title',body:'body'});
    // m2 = new Backbone.Model({id:id++,title:'title2',body:'body2'});
    // t.append(m);
    // t.append(m2);
    // t.selectByModel(m);
    // t.selectByModel(m2);
    // t.selectByModel(m);
    // t.closeByModel(m);
});