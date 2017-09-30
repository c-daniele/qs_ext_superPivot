
// @author: Carmelo Daniele - carmelo.daniele@gmail.com
define(["qlik", "jquery", "css!./style.css", "text!./sp_template.html"], function (qlik, jquery, cssContent, template) {
	'use strict';
	jquery("<style>").html(cssContent).appendTo("head");
	
	var a;
	return {
		template: template,
		initialProperties: {
			qHyperCubeDef: {
				qDimensions: [],
				qMeasures: [],
				qInitialDataFetch: [{
						qWidth: 10,
						qHeight: 1000
					}
				]
			}
			, listItems: []
		},
		definition: {
			type: "items",
			component: "accordion",
			items: {
				dimensions: {
					uses: "dimensions",
					min: 1
				}
				, measures: {
					uses: "measures",
					ref: "qHyperCubeDef.qMeasures",
					//ref: "qAttributeExpressions.0.qExpression",
					disabledRef: "qHyperCubeDef.qLayoutExclude.qHyperCubeDef.qMeasures",
					min: 1,
					allowAdd: !0,
					allowRemove: !0,
					allowMove: !0,
					items: {
						attribute: {
							type: "string",
							ref: "qDef.altLabel",
							label: "Alternative Label",
							expression: "always",
							defaultValue: ""
						}
						
						, valueForTotal: {
							type  : 'string',
							component: 'expression',
							label : 'Value for Total',
							ref  : 'qAttributeExpressions.0.qExpression',
							defaultValue: ''
						}

					}					
				}
				, sorting: {
					uses: "sorting"
				}
				, addons: {
					uses: "addons",
					items: {
						dataHandling: {
							uses: "dataHandling"
						}
					}
				}
				, settings: {
					uses: "settings",
					items: {
						
						PivotOptions: {
							type: "items",
							label: "Pivot Options",
							items: {
								columnsNo: {
									type: "number",
									expression: "optional",
									defaultValue: 30,
									ref: "settings.leftColumnSize",
									label: "Left Column Size (in percentage)"
								}
								, MeasuresPosition: {
									type: "string",
									ref: "settings.measuresPosition",
									component: "buttongroup",
									label: "Measures Column Position",
									options: [ {
										value: 'top',
										label: "Top"
									}, {
										value: 'bottom',
										label: "Bottom"
									}],
									defaultValue: 'top'
								}
								, RowDimensionsNumber: {
									type: "number",
									expression: "optional",
									defaultValue: 1,
									ref: "settings.rowDimensionNumber",
									label: "Row Dimensions Number"
								}
								//, MaxFetchedRows:{
								//	type: "number",
								//	expression: "optional",
								//	defaultValue: 50000,
								//	ref: "settings.maxFetchedRows",
								//	label: "Max fetched rows"
								//}
								, CustomCssStyle: {
									type: "string",
									expression: "optional",
									defaultValue: '',
									ref: "settings.customCssStyle",
									label: "Custom Css Style"
								}
								, SuperPivotContainerClass: {
									type: "string",
									defaultValue: 'MainPivotContainer',
									ref: "settings.superPivotContainerClass",
									label: "Pivot Container Class (useful when more that 1 pivot are used)"
								}
								/*, ShowRowTotals: {
									type: "boolean",
									ref: "settings.showRowTotals",
									component: "buttongroup",
									label: "Show Row Totals",
									options: [ {
										value: true,
										label: "True"
									}, {
										value: false,
										label: "False"
									}],
									defaultValue: true
								}*/
								, ShowColumnTotals: {
									type: "boolean",
									ref: "settings.showColumnTotals",
									component: "buttongroup",
									label: "Show Column Totals",
									options: [ {
										value: true,
										label: "True"
									}, {
										value: false,
										label: "False"
									}],
									defaultValue: true
								}
							}
						}
						/*, about: {
							component: "pp-ec-about",
							show: !0,
							translation: "About",
							label: "About"
						}*/
					}
				}
			}
		},
		support: {
			snapshot: true,
			export: true,
			exportData: true
		}
		/*
		, paint: function () {
			//setup scope.table
			if (!this.jqueryscope.table) {
				this.jqueryscope.table = qlik.table(this);
			}
			return qlik.Promise.resolve();
		}
		*/
		
		, resize: function($element, layout) {
			
			// console.debug('resize');
			//console.log('resize>',$element,layout,$element.scope());
		}
		
		, paint: function ($element, layout) {
			
			// console.debug('paint->layout', layout);
			//console.debug('layout', layout);
			
			this.$scope.selections = [];
			
			a = qlik.currApp();
			if(layout.settings){
				
				this.$scope.settings = layout.settings;
				this.$scope.listItems = layout.listItems;
				//this.$scope.applyStyles();
				//this.$scope.callback=qlik.Promise.resolve;
				this.$scope.callback=function(){return null;};
				this.$scope.prepareTable();
			}
			
			return qlik.Promise.resolve();
		}
		
		, controller: ["$scope", function (_scope) {
			
				_scope.Math = window.Math;
				
				(function() {
					
					window.addStyleString = function(str, root_id) {
						
						// removing dynamic temporary CSS scripts
						var styles = document.querySelectorAll('style');
						for(var i=0; i<styles.length; i++){
							if(styles[i] != undefined && styles[i].innerHTML != undefined
								&& styles[i].innerHTML.indexOf('SM_MAIN_PANEL_CSS' + root_id) >=0){
								
								styles[i].parentNode.removeChild(styles[i]);
								
							}
						}
						
						var str2;
					
						if(root_id != undefined && root_id.length > 0)
							var str2 = str.replace(/sp_main_panel/g, root_id);
						else
							str2 = str;
						
						var node = document.createElement('style');
						document.body.appendChild(node);
						
						node.innerHTML = '/*SM_MAIN_PANEL_CSS' + root_id + '*/' + str2;
					}
				}());
				
				_scope.buildTable = function (){
		
					var retValTable = {
						rows: new Array(),
						headers: new Array(),
						totals: new Array(),
						rowCount: 0,
						colCount: 0
					};
					
					// console.debug('hypercube', _scope.layout.qHyperCube);
					// console.debug('layout', _scope.layout);
					
					for(var i=0;i<_scope.layout.qHyperCube.qDimensionInfo.length; i++){
						
						var dim = _scope.layout.qHyperCube.qDimensionInfo[i];
						
						retValTable.headers.push({
							qFallbackTitle: dim.qFallbackTitle,
							qSortIndicator: dim.qSortIndicator,
							qCardinal: dim.qCardinal,
							qMin: dim.qMin,
							qMax: dim.qMax
						});
						
						dim=null;
						
					}
					
					for(var i=0;i<_scope.layout.qHyperCube.qMeasureInfo.length; i++){
						
						var mis = _scope.layout.qHyperCube.qMeasureInfo[i];
						
						retValTable.headers.push({
							qFallbackTitle: getMeasureTitle(mis),
							qSortIndicator: mis.qSortIndicator,
							qCardinal: mis.qCardinal,
							qMin: mis.qMin,
							qMax: mis.qMax
						});
						
						mis=null;
						
					}
					
					for(var i=0;i<_scope.layout.qHyperCube.qDataPages[0].qMatrix.length; i++){
						
						var cellRows = _scope.layout.qHyperCube.qDataPages[0].qMatrix[i];
						
						var qRow = {
							dimensions: new Array(),
							measures: new Array(),
							cells: new Array()
						};
						
						for(var j=0;j<cellRows.length; j++){
							
							qRow.cells.push(cellRows[j]);
							
							//console.log(cellRows[j]);
							
							// misura
							if(cellRows[j].qState == 'L' 
								&& cellRows[j].qElemNumber >= 0
							){
								
								qRow.measures.push({
									qText: cellRows[j].qText,
									qElemNumber: cellRows[j].qElemNumber,
									qNum: cellRows[j].qNum,
									qAttrExps: cellRows[j].qAttrExps
								});
								
							}
							
							else if(cellRows[j].qElemNumber >= 0
								|| cellRows[j].qElemNumber == -3
								|| (cellRows[j].qText == '-' && cellRows[j].qIsNull)
								)
							{
								
								qRow.dimensions.push({
									qText: cellRows[j].qText,
									qElemNumber: cellRows[j].qElemNumber
								});
								
							}
							
						}
						
						retValTable.rows.push(qRow);
						
						cellRows=null;
						
					}
					
					return retValTable;
					
				}
				
				_scope.prepareTable = function(){
					
					_scope.table = _scope.buildTable();
					
					// only alphanumeric characters
					var regex = /[^a-z0-9]/gi ;
					
					if(_scope.settings.superPivotContainerClass != undefined){
						_scope.settings.superPivotContainerClass = _scope.settings.superPivotContainerClass.replace(regex, '_');
					}
					else{
						_scope.settings.superPivotContainerClass = '';
					}
					
					addStyleString(_scope.settings.customCssStyle, _scope.settings.superPivotContainerClass);
					
					
					/*
					DYNAMIC DATA FETCH
					//bind the listener
					_scope.table.OnData.bind( function() {
							
							if( ( _scope.table.rowCount > _scope.table.rows.length) && _scope.table.rows.length < _scope.settings.maxFetchedRows ){
								_scope.table.getMoreData();
							}
							else{
								_scope._self.paint(_scope._element, _scope._layout);
							}
							
							//table.OnData.unbind( listener );
						}
					);
					
					if( ( _scope.table.rowCount > _scope.table.rows.length) && _scope.table.rows.length < _scope.settings.maxFetchedRows ){
						_scope.table.getMoreData();
					}
					*/

					// row dimension
					_scope.rowDimensions = new Array();
					
					// column dimension
					_scope.columnDimensions = new Array();
					
					var rowDimensionNumber = _scope.settings.rowDimensionNumber;
					
					// measures column position
					var measureColumnVerticalIndex = (_scope.settings.measuresPosition == 'bottom') ? _scope.layout.qHyperCube.qDimensionInfo.length-rowDimensionNumber : 0;

					// console.log("preparing table...");
					// console.debug('table', _scope.table);
					
					_scope.tableBody = new Array();
					
					_scope.vHeaderDimensions = new Array();
					_scope.hHeaderDimensions = new Array();
					
					var vHeaderRoot = {qText: 'spRootElement', children: new Array()};
					var hHeaderRoot = {qText: 'spRootElement', children: new Array()};
					
					_scope.hHeaderDimensions[measureColumnVerticalIndex]={
						qFallbackTitle : 'Measures',
						qHyperCubeIndex : -1
					};
					
					for(var i=0; i<_scope.layout.qHyperCube.qDimensionInfo.length; i++){
						
						var dimIndex = i;
						var tmpArray = _scope.vHeaderDimensions;
								
						// column dimension
						if(i+1>rowDimensionNumber){
							
							tmpArray = _scope.hHeaderDimensions;
							dimIndex -= rowDimensionNumber;
							
							// jump over the next dimension (measures)
							if(dimIndex >= measureColumnVerticalIndex){
								
								dimIndex += 1; 
								
							}

						}

						tmpArray[dimIndex] = {
							qFallbackTitle: _scope.layout.qHyperCube.qDimensionInfo[i].qFallbackTitle,
							qHyperCubeIndex: i
						};
						
						tmpArray=null;
						
					}
					
					if(_scope.table && _scope.table.rows){
						
						// loop on table items
						for(var rowIndex=0;rowIndex<_scope.table.rows.length; rowIndex++){
							
							var row = _scope.table.rows[rowIndex];
							
							if(row.dimensions.length == 0){
								continue;
							}
							
							var vNode = findNode(_scope, _scope.vHeaderDimensions, vHeaderRoot, row);
							
							for(var mIndex=0; mIndex<_scope.layout.qHyperCube.qMeasureInfo.length; mIndex++){
								
								var hNode = findNode(_scope, _scope.hHeaderDimensions, hHeaderRoot, row, mIndex);

							}
							
							// console.debug('row', row);
							// console.debug('vHeaderRoot', vHeaderRoot);
							// console.debug('hHeaderRoot', hHeaderRoot);
							
							row=null;
							
						}
						
						// console.debug('vHeaderRoot', vHeaderRoot);
						// console.debug('hHeaderRoot', hHeaderRoot);
						
						for(var j=0;j<hHeaderRoot.children.length; j++){
							
							hHeaderRoot.children[j].span = recursiveSpan(hHeaderRoot.children[j]);
							
						}
						
						for(var j=0;j<vHeaderRoot.children.length; j++){
							
							vHeaderRoot.children[j].span = recursiveSpan(vHeaderRoot.children[j]);
							
						}
						
						// console.debug('hHeaderRoot', hHeaderRoot);
						// console.debug('vHeaderRoot', vHeaderRoot);
						
						// console.debug('_scope.rowDimensions', _scope.rowDimensions);
						// console.debug('_scope.columnDimensions', _scope.columnDimensions);
						

						// loop again on table items
						for(var rowIndex=0;rowIndex<_scope.table.rows.length; rowIndex++){
							
							var row = _scope.table.rows[rowIndex];
							
							if(row.dimensions.length == 0){
								continue;
							}
							
							if(_scope.hHeaderDimensions.length > 0 && _scope.vHeaderDimensions.length > 0){
								
								var lastColumnIndex = _scope.hHeaderDimensions.length-1;
								var lastRowIndex = _scope.vHeaderDimensions.length-1;
								
								var rowCoordinates = {
									column: 0
									, row: 0
								};
								
								var params = {shift: 0, dimIndex: 0, mIndex: -1, stop: false};
								rowCoordinates.row += recursiveShiftEvaluation(row, _scope.vHeaderDimensions, vHeaderRoot, params);
								
								 // console.debug('row', row);
								for (var mIndex=0; mIndex < _scope.layout.qHyperCube.qMeasureInfo.length; mIndex++){
									
									rowCoordinates.column = 0;
									
									var measure = row.measures[mIndex];
									
									// console.debug('measure', row.measures[mIndex]);
									//console.log(row.dimensions[lastColumnIndex]);
									//console.log(rowCoordinates);
									
									// var entries = undefined;
									// var rowIndexes = new Array();
									
									params = {shift: 0, dimIndex: 0, mIndex: mIndex, stop: false};
									rowCoordinates.column += recursiveShiftEvaluation(row, _scope.hHeaderDimensions, hHeaderRoot, params);
									
									// console.debug('_scope.rowDimensions', _scope.rowDimensions);

									// console.debug('mIndex', mIndex);
									// console.debug('rowCoordinates', rowCoordinates);
									
									// console.log(_scope.columnDimensions);
									
									if(_scope.tableBody[rowCoordinates.row] == undefined){
										_scope.tableBody[rowCoordinates.row] = {
											columnSize: 0,
											columns: new Array()
										};
										
									}
									
									if(rowCoordinates.column >= 0){
										
										// ALT 2
										var base_index = _scope.layout.qHyperCube.qDimensionInfo.length;
										
										var cellIndex = base_index+mIndex;
										
										_scope.tableBody[rowCoordinates.row].columns[rowCoordinates.column] = {
											qText : (row.measures[mIndex] != undefined) ? row.measures[mIndex].qText : ''
											, qNum : (row.measures[mIndex] != undefined) ? row.measures[mIndex].qNum : null
											, qAttrExps : (row.measures[mIndex] != undefined) ? row.cells[cellIndex].qAttrExps : null
										}
									}
									
								}
								
							}

						}
						
						// console.debug('_scope.tableBody', _scope.tableBody);
						
						_scope.columnTotals = new Array();
						_scope.rowTotals = new Array();
						var rowTotalCount = new Array();
						
						_scope.tableBodyCols = 0;
						for(var rowIndex=0; rowIndex<_scope.tableBody.length; rowIndex++){
							
							if(_scope.rowTotals[rowIndex] == undefined){
								_scope.rowTotals[rowIndex] = {qNum: 0, qText: '0', qFormat: undefined};
								rowTotalCount[rowIndex] = 0;
							}
							
							if(_scope.tableBody[rowIndex] != undefined){
								for(var colIndex=0; colIndex<_scope.tableBody[rowIndex].columns.length; colIndex++){
									
									if((colIndex+1) > _scope.tableBodyCols){
										_scope.tableBodyCols = (colIndex+1);
									}
									
									// Percentage/Float, soluzione temporanea
									var tmpFormat = (
										_scope.tableBody[rowIndex].columns[colIndex] != undefined
										&& _scope.tableBody[rowIndex].columns[colIndex].qText != undefined
										&& _scope.tableBody[rowIndex].columns[colIndex].qText.indexOf('%') >= 0
									) ? 'P' : 'F';
									
									// TODO
									// it should be better if we could identify not summable columns (for example different types)
											
									if(_scope.columnTotals[colIndex] == undefined){
										_scope.columnTotals[colIndex] = {
											qNum: 0
											, qText: '0'
											, format:  tmpFormat
										};
									}
									
									if(_scope.tableBody[rowIndex].columns[colIndex] != undefined){
										
										var tmpValue=0;
										
										if(_scope.tableBody[rowIndex].columns[colIndex].qAttrExps != undefined
											&& _scope.tableBody[rowIndex].columns[colIndex].qAttrExps.qValues != undefined
											&& _scope.tableBody[rowIndex].columns[colIndex].qAttrExps.qValues[0] != undefined
											&& _scope.tableBody[rowIndex].columns[colIndex].qAttrExps.qValues[0].qNum != undefined
											&& !isNaN(_scope.tableBody[rowIndex].columns[colIndex].qAttrExps.qValues[0].qNum)
										){
											tmpValue = _scope.tableBody[rowIndex].columns[colIndex].qAttrExps.qValues[0].qNum;
										}
										else{
											tmpValue = _scope.tableBody[rowIndex].columns[colIndex].qNum;
										}
										
										_scope.columnTotals[colIndex].qNum += tmpValue;
										_scope.rowTotals[rowIndex].qNum += tmpValue;
										
										rowTotalCount[rowIndex]++;
										
										// FIXME
										// it should be better to add a property to customize number formats on totals 
										if(tmpFormat == 'P'){
											
											var tmpNum = (_scope.columnTotals[colIndex].qNum*100);
											_scope.columnTotals[colIndex].qText = tmpNum.toLocaleString('it-IT', { maximumFractionDigits: 2 }) + ' %';
											
										}
										else{
											_scope.columnTotals[colIndex].qText = _scope.columnTotals[colIndex].qNum.toLocaleString('it-IT', { maximumFractionDigits: 2 });
										}
									}
									
								}
								
								_scope.tableBody[rowIndex].columnSize = rowTotalCount[rowIndex];
								
							}
							if(rowTotalCount[rowIndex] == 0){
								
								_scope.tableBody.splice(rowIndex,1);
								rowIndex--;
								
							}
							
						}
						
						// console.debug('_scope.tableBody', _scope.tableBody);
						
						if(_scope.hHeaderDimensions.length > 0 && _scope.vHeaderDimensions.length > 0){
							
							_scope.horizontalHeaders = new Array();
							_scope.verticalHeaders = new Array();

							// console.debug('ROW_DIMENSIONS ', _scope.rowDimensions);
							// console.debug('_scope.rowDimensions', _scope.rowDimensions);
							// console.debug('_scope.columnDimensions', _scope.columnDimensions);
							
							var params = {headerIndex: 0, dimIndex: 0};
							buildVHeader(vHeaderRoot, _scope.verticalHeaders, params);
							
							//console.debug('_scope.hHeaderDimensions', _scope.hHeaderDimensions);
							var params = {headerIndex: 0, dimIndex: 0};
							buildHHeader(_scope, hHeaderRoot, _scope.horizontalHeaders, params, _scope.hHeaderDimensions);
							
							params = null;
							
						}
						
						// console.log(_scope.verticalHeaders);
						// console.log(_scope.tableBody);
						
					}
					
					_scope.table = null; 
					hHeaderRoot = null;
					vHeaderRoot = null;
					
					_scope.callback();
					
				}
				
				var buildVHeader = function(_node, _header, _params){
								
					if(_node.children == undefined || _node.children.length == 0){
						
						_params.headerIndex++;
						return;
						
					}
					
					for(var j=0;j<_node.children.length; j++){
						
						if(_header[_params.headerIndex] == undefined){
							_header[_params.headerIndex] = new Array();
						}
						
						_header[_params.headerIndex].push({
								span: _node.children[j].span
								, rendered: true
								//, type: ((_headerDimensions[_params.dimIndex].qHyperCubeIndex == -1) ? 'measure' : 'dimension')
								, type: 'dimension'
								, qText: _node.children[j].qText
							});
						
						_params.dimIndex++;
						buildVHeader(_node.children[j], _header, _params);
						_params.dimIndex--;
					}
					
				}
				
				var buildHHeader = function(__scope, _node, _header, _params, _headerDimensions){
					
					if(__scope.horizontalHeaders[_params.headerIndex] == undefined){
						
						__scope.horizontalHeaders[_params.headerIndex] = new Array();
						
					}
					
					__scope.horizontalHeaders[_params.headerIndex] = __scope.horizontalHeaders[_params.headerIndex].concat(_node.children);
					
					for(var j=0; j<_node.children.length; j++){
						
						_params.headerIndex++;
						buildHHeader(__scope, _node.children[j], _header, _params, _headerDimensions)
						_params.headerIndex--;
						
					}
					
				}
				
				var recursiveShiftEvaluation = function(_row, _headerDimensions, _node, _params){
					
					if(_headerDimensions[_params.dimIndex] == undefined){
						return 0;
					}
								
					var valueIndex = -1;
					var retVal = 0;
					
					if(_headerDimensions[_params.dimIndex].qHyperCubeIndex == -1){
						valueIndex = _params.mIndex;
					}
					else if(_row.dimensions[_headerDimensions[_params.dimIndex].qHyperCubeIndex] != undefined){
						valueIndex = _node.children.findIndex(childIndexFinder, {'_row' : _row, '_head': _headerDimensions[_params.dimIndex]});
					}
					
					for(var j=0; j<valueIndex; j++){
						
						if(_node.children[j] == undefined || _node.children[j].span == undefined){
							retVal += valueIndex;
						}
						else if(
							(_headerDimensions[_params.dimIndex].qHyperCubeIndex != -1)
							|| (_headerDimensions[_params.dimIndex].qHyperCubeIndex == -1) && (_node.children[j].elNumber < _params.mIndex)
							){
							
							retVal += _node.children[j].span;
						}
						
					}
					
					if(valueIndex >= 0){
						
						_params.dimIndex++;
						retVal += recursiveShiftEvaluation(_row, _headerDimensions, _node.children[valueIndex], _params);
						_params.dimIndex--;
						_params.shift += retVal;
						
					}
					
					return retVal;
					
				}
				
				var recursiveSpan = function(item){
						
					var retVal = 0;
					
					if(item == undefined || item.children == undefined || item.children.length == 0)
						return 1;
					
					for(var i=0; i<item.children.length; i++){
						
						// console.debug('item.children[i]', item.children[i]);
						item.children[i].span = recursiveSpan(item.children[i]);
						retVal += item.children[i].span
						
					}
					
					return retVal;
				};

				var findNode = function(_scope, _dimensionHeader, _root, _row, _mIndex){
								
					var currentNode = _root;
					var currentNodeValues = currentNode.children;
					
					for(var i=0; i<_dimensionHeader.length; i++){
						
						var tmpIndex;
						
						if(_dimensionHeader[i].qHyperCubeIndex < 0){
							
							var pars = {'_scope' : _scope, '_mIndex': _mIndex};
							
							tmpIndex = currentNodeValues.findIndex(measureIndexFinder, pars);
							
							if(tmpIndex == -1){
								
								var subT = new Array();
								
								var tmpItem = {
									qText: getMeasureTitle(_scope.layout.qHyperCube.qMeasureInfo[_mIndex])
									, elNumber: _mIndex
									, children: new Array()
									, span: 1
									, type: 'measure'
									, subTotals: subT
								};
								
								currentNodeValues.push(tmpItem);
								
								tmpIndex = currentNodeValues.findIndex(measureIndexFinder, pars);
								
							}
							
							updateSubTotals(currentNodeValues[tmpIndex].subTotals, _row, _mIndex);
							
							currentNode = currentNodeValues[tmpIndex];
							currentNodeValues = currentNode.children;
							
						}
						else{
							
							var pars = {'_row' : _row, '_head': _dimensionHeader[i]};
							tmpIndex = currentNodeValues.findIndex(indexFinder, pars);

							if(tmpIndex == -1){
								
								var subTotals = new Array();

								for(var mIndex=0; mIndex<_scope.layout.qHyperCube.qMeasureInfo.length; mIndex++){
									subTotals[mIndex] = 0;
								}

								var tmpItem = {
									qText: _row.dimensions[_dimensionHeader[i].qHyperCubeIndex].qText
									, elNumber: _row.dimensions[_dimensionHeader[i].qHyperCubeIndex].qElemNumber
									, children: new Array()
									, span: 1
									, type: 'dimension'
									, subTotals: subTotals
								};
								
								currentNodeValues.push(tmpItem);
								
								tmpIndex = currentNodeValues.findIndex(indexFinder, pars);

							}
							
							if(_mIndex >= 0){
								updateSubTotals(currentNodeValues[tmpIndex].subTotals, _row, _mIndex);
							}
							else{
								for(var mIndex=0; mIndex<_scope.layout.qHyperCube.qMeasureInfo.length; mIndex++){
									updateSubTotals(currentNodeValues[tmpIndex].subTotals, _row, mIndex);
								}
							}
							
							currentNode = currentNodeValues[tmpIndex];
							currentNodeValues = currentNodeValues[tmpIndex].children;
						}

					}
					
					return currentNode;
					
				}
				
				var updateSubTotals = function(_subTotals, _row, _mIndex){
					
					var base_index = 0;
					for(; base_index< _row.cells.length; base_index++){
						
						// measure
						if(_row.cells[base_index].qState == 'L' && _row.cells[base_index].qElemNumber >= 0){
							break;
						}
						
					}
					
					var index = base_index+_mIndex;
					
					if(_row.cells[index].qAttrExps != undefined
						&& _row.cells[index].qAttrExps.qValues != undefined
						&& _row.cells[index].qAttrExps.qValues[0] != undefined
						&& _row.cells[index].qAttrExps.qValues[0].qNum != undefined
						&& !isNaN(_row.cells[index].qAttrExps.qValues[0].qNum)
					){
						_subTotals[_mIndex] += _row.cells[index].qAttrExps.qValues[0].qNum;
					}
					else{
						_subTotals[_mIndex] += _row.cells[index].qNum;
					}
					
				}
				
				var getMeasureTitle = function(mInfo){
					
					if(mInfo != undefined
						&& mInfo.altLabel != undefined
						&& mInfo.altLabel.length > 0
					){
						
						return mInfo.altLabel;
					}
					
					return mInfo.qFallbackTitle;
					
				}
				
				var measureIndexFinder = function(el, index, array){
					return el.qText == getMeasureTitle(this._scope.layout.qHyperCube.qMeasureInfo[this._mIndex]);
				}
				
				var indexFinder = function(el, index, array){
					return el.qText == this._row.dimensions[this._head.qHyperCubeIndex].qText;
				}
				
				var childIndexFinder = function(el, index, array){
					return el.qText == this._row.dimensions[this._head.qHyperCubeIndex].qText;
				}
				
				_scope.range = function(min, max, step) {
					step = step || 1;
					var input = [];
					for (var i = min; i <= max; i += step) {
						input.push(i);
					}
					return input;
				};
				
				_scope.applyStyles = function () {
					_scope.mainKpi = {
						color: _scope.settings.maincolor,
						borderRight: _scope.settings.borderwidth + " solid " + _scope.settings.bordercolor,
						background: _scope.settings.bg
					}
					, _scope.header = {
						color: _scope.settings.headercolor,
						background: _scope.settings.headerbg,
						borderBottom: "1px solid " + _scope.settings.headerborder,
						borderRight: _scope.settings.borderwidth + " solid " + _scope.settings.bordercolor,
						borderTop: _scope.settings.borderwidth + " solid " + _scope.settings.bordercolor
					}
					, _scope.content = {
						borderLeftColor: _scope.settings.indicatorcolor
					}
				}
				, _scope.action = function () {
					if ("edit" != qlik.navigation.getMode())
						for (var o = 0; o <= _scope.listItems.length - 1; o++)
							switch (_scope.listItems[o].settings.action1type) {
							case "Field":
								a.field(_scope.listItems[o].settings.action1name).selectValues([_scope.listItems[o].settings.action1value], _scope.listItems[o].settings.action1Method);
								break;
							case "Sheet": ;
								qlik.navigation.gotoSheet(_scope.listItems[o].settings.sheet.split("|")[1]);
								break;
							case "Variable":
								a.variable.setContent(_scope.listItems[o].settings.action1name, _scope.listItems[o].settings.action1value)
							}
				}
				
				// console.log("Controller End");
				
			}
		]
		
	};

});