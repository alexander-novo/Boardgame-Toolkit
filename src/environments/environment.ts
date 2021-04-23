// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
	production: false,
	editor: {
		autoSaveBarDuration: 1000,
		autoSaveInterval: 10000,
		workspace: {
			totalWidth: 50000,
			totalHeight: 50000,
			boundsStrokeWidth: 10,
			minZoom: .04,
			maxZoom: 20,
			grid: 200,
			zoomSpeed: .002,
			defaultRegionGroupColor: 'LimeGreen',
		}
	},
	maxAssetSize: 4000000,
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/dist/zone-error';  // Included with Angular CLI.
