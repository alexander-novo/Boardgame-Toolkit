const { Schema, model, Mixed } = require("mongoose");

const colorValidator = (v) => (/^#([0-9a-f]{3}){1,2}$/i).test(v)

const MapSchema = new Schema({
	name: { type: String, required: false },
	color: { type: String, required: false, validator: [colorValidator, 'Invalid Color'] },
	visible: { type: Boolean, required: true, default: true },
});

const EdgeSchema = new Schema({
	map: { type: Number, required: true },
	destination: { type: Number, required: true },
});

const RegionSchema = new Schema({
	name: { type: String, required: false },
	shape: { type: String, required: true, enum: ['Square', 'Circle', 'Polygon'] },
	edges: [EdgeSchema],
	params: {
		type: {
			nonpoly: {
				type: {
					top: { type: Number, required: true },
					left: { type: Number, required: true },
					scaleX: { type: Number, required: true },
					scaleY: { type: Number, required: true },
					angle: { type: Number, required: true },
				},
				required: () => this.shape != 'Polygon',
			},
			points: [{
				x: { type: Number, required: true },
				y: { type: Number, required: true },
			}],
		},
		required: true,
	},
});

const RegionGroupSchema = new Schema({
	name: { type: String, required: false },
	color: { type: String, required: false, validator: [colorValidator, 'Invalid Color'] },
	visible: { type: Boolean, required: true, default: true },
	regions: [RegionSchema],
	maps: [MapSchema],
});

const AssetSchema = new Schema({
	name: { type: String, required: true },
	url: { type: String, required: true },
	size: { type: Number, required: true },
	position: {
		type: {
			x: { type: Number, required: true },
			y: { type: Number, required: true },
		},
		required: false,
	},
	scale: {
		type: {
			x: { type: Number, required: true },
			y: { type: Number, required: true },
		},
		required: false,
	},
	angle: {
		type: Number,
		required: true,
		default: 0,
	},
	assetCollection: { type: Number, required: false },
	hiddenFromPlayers: { type: Boolean, required: true, default: false },
	tags: [{
		index: { type: Number, required: true },
		properties: [Mixed],
	}],
	regionGroups: [RegionGroupSchema],
});

const AssetCollectionSchema = new Schema({
	name: { type: String, required: true },
	assets: [{ type: Number, required: true }],
	url: { type: String, required: false },
	position: {
		type: {
			x: { type: Number, required: true },
			y: { type: Number, required: true },
		},
		required: false,
	},
	scale: {
		type: {
			x: { type: Number, required: true },
			y: { type: Number, required: true },
		},
		required: false,
	},
	angle: {
		type: Number,
		required: true,
		default: 0,
	},
	tags: [{
		index: { type: Number, required: true },
		properties: [Mixed],
	}],
	hiddenFromPlayers: { type: Boolean, required: true, default: false },
});

const ProjectSchema = new Schema({
	name: { type: String, required: true },
	owner: { type: Schema.Types.ObjectId, ref: 'User', required: true },
	date: {
		created: { type: Date, required: true, default: Date.now },
		modified: { type: Date, required: true, default: Date.now },
	},
	thumbnail: { type: String, required: false },
	assets: [AssetSchema],
	assetCollections: [AssetCollectionSchema],
	published: { type: Boolean, required: true, default: false },
	projectTags: [{
		name: { type: String, required: true },
		color: { type: String, required: false, validator: [colorValidator, 'Invalid Color'] },
		properties: [{
			name: { type: String, required: true },
			dataType: { type: String, required: true, enum: ['number', 'boolean', 'string', 'tag'] }
		}],
	}],
	camera: {
		x: { type: Number, required: true, default: 0 },
		y: { type: Number, required: true, default: 0 },
		zoom: { type: Number, required: true, default: 1 },
	},
});

module.exports = model("Project", ProjectSchema);