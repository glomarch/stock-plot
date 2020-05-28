
        
        //////// my cursor from synch-sursor.html //////////////////////
            const cursorOpts = {
					lock: true,
					focus: {
						prox: 16,
					},
					sync: {
						key: "moo",
						setSeries: true,
					},
			};
                
            //////////////////
           
			function fmtUSD(val, dec) {
				//return "$" + val.toFixed(dec).replace(/\d(?=(\d{3})+(?:\.|$))/g, "$&,");
                
                return  val + "." + dec;
			}

			function randInt(min, max) {
				min = Math.ceil(min);
				max = Math.floor(max);
				return Math.floor(Math.random() * (max - min + 1)) + min;
			}

			// column-highlights the hovered x index
			function columnHighlightPlugin({ className, style = {backgroundColor: "rgba(51,204,255,0.3)"} } = {}) {
				let underEl, overEl, highlightEl, currIdx;

				function init(u) {
					underEl = u.root.querySelector(".under");
					overEl = u.root.querySelector(".over");

					highlightEl = document.createElement("div");

					className && highlightEl.classList.add(className);

					uPlot.assign(highlightEl.style, {
						pointerEvents: "none",
						display: "none",
						position: "absolute",
						left: 0,
						top: 0,
						height: "100%",
						...style
					});

					underEl.appendChild(highlightEl);

					// show/hide highlight on enter/exit
					overEl.addEventListener("mouseenter", () => {highlightEl.style.display = null;});
					overEl.addEventListener("mouseleave", () => {highlightEl.style.display = "none";});
				}

				function update(u) {
					if (currIdx !== u.cursor.idx) {
						currIdx = u.cursor.idx;

						let [iMin, iMax] = u.series[0].idxs;

						const dx    = iMax - iMin;
						const width = (u.bbox.width / dx) / devicePixelRatio;
						const xVal  = u.scales.x.distr == 2 ? currIdx : u.data[0][currIdx];
						const left  = u.valToPos(xVal, "x") - width / 2;

						highlightEl.style.transform = "translateX(" + Math.round(left) + "px)";
						highlightEl.style.width = Math.round(width) + "px";
					}
				}

				return {
					opts: (u, opts) => {
						uPlot.assign(opts, {
                            //cpadd
                            cursor: cursorOpts
                            /*
							cursor: {
								x: false,
								y: false,
							}
                            */
						});
					},
					hooks: {
						init: init,
						setCursor: update,
					}
				};
                
			}  //end columnHighlightPlugin

			// converts the legend into a simple tooltip
			function legendAsTooltipPlugin({ className, style = { backgroundColor:"rgba(255, 249, 196, 0.92)", color: "black" } } = {}) {
				let legendEl;

				function init(u, opts) {
					legendEl = u.root.querySelector(".legend");

					legendEl.classList.remove("inline");
					legendEl.classList.add("hidden");
					className && legendEl.classList.add(className);

					uPlot.assign(legendEl.style, {
						textAlign: "left",
						pointerEvents: "none",
						display: "none",
						position: "absolute",
						left: 0,
						top: 0,
						zIndex: 100,
						boxShadow: "2px 2px 10px rgba(0,0,0,0.5)",
						...style
					});

					// hide series color markers
					const idents = legendEl.querySelectorAll(".ident");

					for (let i = 0; i < idents.length; i++)
						idents[i].style.display = "none";

					const overEl = u.root.querySelector(".over");
					overEl.style.overflow = "visible";

					// move legend into plot bounds
					overEl.appendChild(legendEl);

					// show/hide tooltip on enter/exit
					overEl.addEventListener("mouseenter", () => {legendEl.style.display = null;});
					overEl.addEventListener("mouseleave", () => {legendEl.style.display = "none";});

					// let tooltip exit plot
				//	overEl.style.overflow = "visible";
				}

				function update(u) {
					const { left, top } = u.cursor;
					legendEl.style.transform = "translate(" + left + "px, " + top + "px)";
				}

				return {
					hooks: {
						init: init,
						setCursor: update,
					}
				};
			}

			// draws candlestick symbols (expects data in OHLC order)
			function candlestickPlugin(
            { gap = 2, shadowColor = "#000000", bearishColor = "#e54245", bullishColor = "#4ab650", bodyMaxWidth = 20, shadowWidth = 2, bodyOutline = 1 } = {}
            ) 
            {

				function drawCandles(u) {
					u.ctx.save();

					const offset = (shadowWidth % 2) / 2;

					u.ctx.translate(offset, offset);

					let [iMin, iMax] = u.series[0].idxs;

					let vol0AsY = u.valToPos(0, "vol", true);

					for (let i = iMin; i <= iMax; i++) {
						let xVal         = u.scales.x.distr == 2 ? i : u.data[0][i];
						let open         = u.data[1][i];
						let high         = u.data[2][i];
						let low          = u.data[3][i];
						let close        = u.data[4][i];
						let vol          = u.data[5][i];
                        let mark         = u.data[6][i];

						let timeAsX      = u.valToPos(xVal,  "x", true);
						let lowAsY       = u.valToPos(low,   "y", true);
						let highAsY      = u.valToPos(high,  "y", true);
						let openAsY      = u.valToPos(open,  "y", true);
						let closeAsY     = u.valToPos(close, "y", true);
						let volAsY       = u.valToPos(vol, "vol", true);


						// shadow rect
						let shadowHeight = Math.max(highAsY, lowAsY) - Math.min(highAsY, lowAsY);
						let shadowX      = timeAsX - (shadowWidth / 2);
						let shadowY      = Math.min(highAsY, lowAsY);

						u.ctx.fillStyle = shadowColor;
						u.ctx.fillRect(
							Math.round(shadowX),
							Math.round(shadowY),
							Math.round(shadowWidth),
							Math.round(shadowHeight),
						);

						// body rect
						let columnWidth  = u.bbox.width / (iMax - iMin);
						let bodyWidth    = Math.min(bodyMaxWidth, columnWidth - gap);
						let bodyHeight   = Math.max(closeAsY, openAsY) - Math.min(closeAsY, openAsY);
						let bodyX        = timeAsX - (bodyWidth / 2);
						let bodyY        = Math.min(closeAsY, openAsY);
						let bodyColor    = open > close ? bearishColor : bullishColor;

						u.ctx.fillStyle = shadowColor;
						u.ctx.fillRect(
							Math.round(bodyX),
							Math.round(bodyY),
							Math.round(bodyWidth),
							Math.round(bodyHeight),
						);

						u.ctx.fillStyle = bodyColor;
						u.ctx.fillRect(
							Math.round(bodyX + bodyOutline),
							Math.round(bodyY + bodyOutline),
							Math.round(bodyWidth - bodyOutline * 2),
							Math.round(bodyHeight - bodyOutline * 2),
						);

						// volume rect
						u.ctx.fillRect(
							Math.round(bodyX),
							Math.round(volAsY),
							Math.round(bodyWidth),
							Math.round(vol0AsY - volAsY),
						);
                        
                        /////////// draw text label ////
                        /////////// draw text label ////
                        if(mark != "") {
                            if("BUY" == mark) { mark = "B"; }
                            if("SELL" == mark) { mark = "S"; }
                            u.ctx.font = '12px Arial';
                            u.ctx.textBaseline = 'bottom';
                            u.ctx.textAlign = 'center';
                            u.ctx.fillText(mark + " " + close, timeAsX, highAsY-48);
                        }
                        
                        /////////////////////////////
                        
					}  //end for

					u.ctx.translate(-offset, -offset);

					u.ctx.restore();
				}

				return {
					opts: (u, opts) => {
						uPlot.assign(opts, {
							cursor: {
								points: {
									show: false,
								}
							}
						});

						opts.series.forEach(series => {
							series.paths = () => null;
							series.points = {show: false};
						});
					},
					hooks: {
						draw: drawCandles,
					}
				};
			}

            ///////////////////////////////////////////////////////

			// gold prices from https://www.investing.com/commodities/gold-historical-data
			// Date,Open,High,Low,Close
                       
            
        function makeChart(packedData)
        { 
           let data = prepData(packedData)
        console.log("data=" + data)
        
			// random volume data
			//data.push(data[0].map(v => randInt(10, 250)));

			const fmtDate = uPlot.fmtDate("{YYYY}-{MM}-{DD}");
			const tzDate = ts => uPlot.tzDate(new Date(ts * 1e3), "Etc/UTC");

			const opts = {
				width: 1920,
				height: 600,
				title: "Glomarch Chart",
				tzDate,
				plugins: [
					columnHighlightPlugin(),
					legendAsTooltipPlugin(),
					candlestickPlugin()
				],
				scales: {
					x: {
						distr: 2,
					},
					vol: {
						range: [0, 20000000],
					},
				},
                cursor: cursorOpts,
				series: [
					{
						label: "Date",
						value: (u, ts) => fmtDate(tzDate(ts)),
					},
					{
						label: "Open",
						value: (u, v) => fmtUSD(v, 2),
					},
					{
						label: "High",
						value: (u, v) => fmtUSD(v, 2),
					},
					{
						label: "Low",
						value: (u, v) => fmtUSD(v, 2),
					},
					{
						label: "Close",
						value: (u, v) => fmtUSD(v, 2),
					},
					{
						label: "Volume",
						scale: 'vol',
					},
				],
				axes: [
					{},
					{
						values: (u, vals) => vals.map(v => fmtUSD(v, 0)),
					},
					{
						side: 1,
						scale: 'vol',
						grid: {show: false},
					}
				]
			};
            
            
             
            
            
            //////////////////////////////////////////
            function getSize() {
				return {
					width: window.innerWidth - 100,
					height: window.innerHeight - 200,
				}
			}
            /////////////////////////////////////////////

			let u = new uPlot(opts, data, document.body);
            
            
            ////////////////////////////////////
            //resize
			function throttle(cb, limit) {
				var wait = false;

				return () => {
					if (!wait) {
						requestAnimationFrame(cb);
						wait = true;
						setTimeout(() => {
							wait = false;
						}, limit);
					}
				}
			}
                 
         window.addEventListener("resize", throttle(() => u.setSize(getSize()), 100));   
         
         
         } //my add
         ////////////////////////////
         
       function prepData(packed) {
				//console.time('prep');

				// epoch,idl,recv,send,read,writ,used,free

				const numFields = packed[0];

				packed = packed.slice(numFields + 1);

				// 55,550 data points x 3 series = 166,650
                let seriesLen = packed.length/numFields;
				let  data = [
					Array(seriesLen),
					Array(seriesLen),
					Array(seriesLen),
					Array(seriesLen),
                    Array(seriesLen),
                    Array(seriesLen),
                    Array(seriesLen),
				];

                //12, "Date","Open","High","Low","Close","AdjClose","Volume","Mark","Amount","Value","Profit","totalProfit"
                for (let i = 0, j = 0; i < packed.length; i += numFields, j++) {
					data[0][j] = packed[i];   //Date
					data[1][j] = packed[i+1]; //Open
					data[2][j] = packed[i+2]; //High
					data[3][j] = packed[i+3]; //Low
                    data[4][j] = packed[i+4]; //Close
                    data[5][j] = packed[i+6]; //Volume
                    data[6][j] = packed[i+7]; //Mark
				}


			 	return data;
                
			}  //end prepData
         ////////////////////////////////////////////////////   
            // let wait = document.getElementById("wait");
		    // wait.textContent = "Fetching data.json (2.07MB)....";
            
            /*
			fetch("bench/QQQ-2020-03-18-to-05_04_32K.csv_with_trade_packed.json").then(r => r.json()).then(packedData => {
				//wait.textContent = "Rendering...";
				//let data = prepData(packed) ;
                                
				setTimeout(() => makeChart(packedData), 0);
                
			});
            
            */
            
         
         //
 
