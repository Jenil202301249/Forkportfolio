/*
   Licensed to the Apache Software Foundation (ASF) under one or more
   contributor license agreements.  See the NOTICE file distributed with
   this work for additional information regarding copyright ownership.
   The ASF licenses this file to You under the Apache License, Version 2.0
   (the "License"); you may not use this file except in compliance with
   the License.  You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
*/
$(document).ready(function() {

    $(".click-title").mouseenter( function(    e){
        e.preventDefault();
        this.style.cursor="pointer";
    });
    $(".click-title").mousedown( function(event){
        event.preventDefault();
    });

    // Ugly code while this script is shared among several pages
    try{
        refreshHitsPerSecond(true);
    } catch(e){}
    try{
        refreshResponseTimeOverTime(true);
    } catch(e){}
    try{
        refreshResponseTimePercentiles();
    } catch(e){}
});


var responseTimePercentilesInfos = {
        data: {"result": {"minY": 54.0, "minX": 0.0, "maxY": 42080.0, "series": [{"data": [[0.0, 54.0], [0.1, 54.0], [0.2, 55.0], [0.3, 55.0], [0.4, 55.0], [0.5, 55.0], [0.6, 56.0], [0.7, 56.0], [0.8, 56.0], [0.9, 56.0], [1.0, 56.0], [1.1, 56.0], [1.2, 57.0], [1.3, 57.0], [1.4, 57.0], [1.5, 57.0], [1.6, 57.0], [1.7, 57.0], [1.8, 57.0], [1.9, 58.0], [2.0, 58.0], [2.1, 58.0], [2.2, 58.0], [2.3, 58.0], [2.4, 58.0], [2.5, 58.0], [2.6, 58.0], [2.7, 58.0], [2.8, 58.0], [2.9, 58.0], [3.0, 59.0], [3.1, 59.0], [3.2, 59.0], [3.3, 59.0], [3.4, 59.0], [3.5, 59.0], [3.6, 59.0], [3.7, 59.0], [3.8, 59.0], [3.9, 60.0], [4.0, 60.0], [4.1, 60.0], [4.2, 60.0], [4.3, 60.0], [4.4, 60.0], [4.5, 60.0], [4.6, 60.0], [4.7, 60.0], [4.8, 60.0], [4.9, 60.0], [5.0, 60.0], [5.1, 61.0], [5.2, 61.0], [5.3, 61.0], [5.4, 61.0], [5.5, 61.0], [5.6, 61.0], [5.7, 61.0], [5.8, 61.0], [5.9, 61.0], [6.0, 61.0], [6.1, 61.0], [6.2, 61.0], [6.3, 61.0], [6.4, 61.0], [6.5, 61.0], [6.6, 62.0], [6.7, 62.0], [6.8, 62.0], [6.9, 62.0], [7.0, 62.0], [7.1, 62.0], [7.2, 62.0], [7.3, 62.0], [7.4, 62.0], [7.5, 62.0], [7.6, 62.0], [7.7, 62.0], [7.8, 63.0], [7.9, 63.0], [8.0, 63.0], [8.1, 63.0], [8.2, 63.0], [8.3, 63.0], [8.4, 63.0], [8.5, 63.0], [8.6, 63.0], [8.7, 63.0], [8.8, 63.0], [8.9, 63.0], [9.0, 63.0], [9.1, 63.0], [9.2, 63.0], [9.3, 63.0], [9.4, 64.0], [9.5, 64.0], [9.6, 64.0], [9.7, 64.0], [9.8, 64.0], [9.9, 64.0], [10.0, 64.0], [10.1, 64.0], [10.2, 64.0], [10.3, 64.0], [10.4, 64.0], [10.5, 64.0], [10.6, 64.0], [10.7, 64.0], [10.8, 64.0], [10.9, 64.0], [11.0, 64.0], [11.1, 65.0], [11.2, 65.0], [11.3, 65.0], [11.4, 65.0], [11.5, 65.0], [11.6, 65.0], [11.7, 65.0], [11.8, 65.0], [11.9, 65.0], [12.0, 65.0], [12.1, 65.0], [12.2, 65.0], [12.3, 65.0], [12.4, 66.0], [12.5, 66.0], [12.6, 66.0], [12.7, 66.0], [12.8, 66.0], [12.9, 66.0], [13.0, 66.0], [13.1, 66.0], [13.2, 66.0], [13.3, 66.0], [13.4, 66.0], [13.5, 66.0], [13.6, 66.0], [13.7, 66.0], [13.8, 66.0], [13.9, 66.0], [14.0, 66.0], [14.1, 67.0], [14.2, 67.0], [14.3, 67.0], [14.4, 67.0], [14.5, 67.0], [14.6, 67.0], [14.7, 67.0], [14.8, 67.0], [14.9, 67.0], [15.0, 67.0], [15.1, 67.0], [15.2, 67.0], [15.3, 67.0], [15.4, 67.0], [15.5, 68.0], [15.6, 68.0], [15.7, 68.0], [15.8, 68.0], [15.9, 68.0], [16.0, 68.0], [16.1, 68.0], [16.2, 68.0], [16.3, 68.0], [16.4, 68.0], [16.5, 68.0], [16.6, 68.0], [16.7, 68.0], [16.8, 68.0], [16.9, 68.0], [17.0, 69.0], [17.1, 69.0], [17.2, 69.0], [17.3, 69.0], [17.4, 69.0], [17.5, 69.0], [17.6, 69.0], [17.7, 69.0], [17.8, 69.0], [17.9, 69.0], [18.0, 69.0], [18.1, 69.0], [18.2, 69.0], [18.3, 69.0], [18.4, 70.0], [18.5, 70.0], [18.6, 70.0], [18.7, 70.0], [18.8, 70.0], [18.9, 70.0], [19.0, 70.0], [19.1, 70.0], [19.2, 70.0], [19.3, 70.0], [19.4, 71.0], [19.5, 71.0], [19.6, 71.0], [19.7, 71.0], [19.8, 71.0], [19.9, 71.0], [20.0, 71.0], [20.1, 71.0], [20.2, 71.0], [20.3, 71.0], [20.4, 71.0], [20.5, 71.0], [20.6, 71.0], [20.7, 72.0], [20.8, 72.0], [20.9, 72.0], [21.0, 72.0], [21.1, 72.0], [21.2, 72.0], [21.3, 72.0], [21.4, 73.0], [21.5, 73.0], [21.6, 73.0], [21.7, 73.0], [21.8, 73.0], [21.9, 73.0], [22.0, 73.0], [22.1, 73.0], [22.2, 74.0], [22.3, 74.0], [22.4, 74.0], [22.5, 74.0], [22.6, 74.0], [22.7, 74.0], [22.8, 74.0], [22.9, 74.0], [23.0, 74.0], [23.1, 74.0], [23.2, 74.0], [23.3, 74.0], [23.4, 75.0], [23.5, 75.0], [23.6, 75.0], [23.7, 75.0], [23.8, 75.0], [23.9, 75.0], [24.0, 75.0], [24.1, 75.0], [24.2, 75.0], [24.3, 75.0], [24.4, 75.0], [24.5, 76.0], [24.6, 76.0], [24.7, 76.0], [24.8, 76.0], [24.9, 76.0], [25.0, 76.0], [25.1, 76.0], [25.2, 76.0], [25.3, 76.0], [25.4, 76.0], [25.5, 76.0], [25.6, 76.0], [25.7, 76.0], [25.8, 76.0], [25.9, 76.0], [26.0, 77.0], [26.1, 77.0], [26.2, 77.0], [26.3, 77.0], [26.4, 77.0], [26.5, 77.0], [26.6, 77.0], [26.7, 77.0], [26.8, 77.0], [26.9, 77.0], [27.0, 77.0], [27.1, 77.0], [27.2, 77.0], [27.3, 77.0], [27.4, 77.0], [27.5, 77.0], [27.6, 78.0], [27.7, 78.0], [27.8, 78.0], [27.9, 78.0], [28.0, 78.0], [28.1, 78.0], [28.2, 78.0], [28.3, 78.0], [28.4, 78.0], [28.5, 78.0], [28.6, 78.0], [28.7, 79.0], [28.8, 79.0], [28.9, 79.0], [29.0, 79.0], [29.1, 79.0], [29.2, 79.0], [29.3, 79.0], [29.4, 79.0], [29.5, 79.0], [29.6, 79.0], [29.7, 79.0], [29.8, 79.0], [29.9, 79.0], [30.0, 79.0], [30.1, 79.0], [30.2, 79.0], [30.3, 79.0], [30.4, 79.0], [30.5, 80.0], [30.6, 80.0], [30.7, 80.0], [30.8, 80.0], [30.9, 80.0], [31.0, 80.0], [31.1, 80.0], [31.2, 80.0], [31.3, 80.0], [31.4, 80.0], [31.5, 80.0], [31.6, 80.0], [31.7, 80.0], [31.8, 80.0], [31.9, 81.0], [32.0, 81.0], [32.1, 81.0], [32.2, 81.0], [32.3, 81.0], [32.4, 81.0], [32.5, 81.0], [32.6, 81.0], [32.7, 81.0], [32.8, 81.0], [32.9, 81.0], [33.0, 82.0], [33.1, 82.0], [33.2, 82.0], [33.3, 82.0], [33.4, 82.0], [33.5, 82.0], [33.6, 82.0], [33.7, 82.0], [33.8, 82.0], [33.9, 82.0], [34.0, 82.0], [34.1, 82.0], [34.2, 82.0], [34.3, 82.0], [34.4, 83.0], [34.5, 83.0], [34.6, 83.0], [34.7, 83.0], [34.8, 83.0], [34.9, 83.0], [35.0, 84.0], [35.1, 84.0], [35.2, 84.0], [35.3, 84.0], [35.4, 84.0], [35.5, 84.0], [35.6, 84.0], [35.7, 84.0], [35.8, 85.0], [35.9, 85.0], [36.0, 85.0], [36.1, 85.0], [36.2, 85.0], [36.3, 85.0], [36.4, 85.0], [36.5, 86.0], [36.6, 86.0], [36.7, 86.0], [36.8, 86.0], [36.9, 86.0], [37.0, 86.0], [37.1, 86.0], [37.2, 86.0], [37.3, 86.0], [37.4, 86.0], [37.5, 86.0], [37.6, 87.0], [37.7, 87.0], [37.8, 87.0], [37.9, 87.0], [38.0, 87.0], [38.1, 87.0], [38.2, 87.0], [38.3, 87.0], [38.4, 87.0], [38.5, 88.0], [38.6, 88.0], [38.7, 88.0], [38.8, 88.0], [38.9, 88.0], [39.0, 88.0], [39.1, 88.0], [39.2, 88.0], [39.3, 89.0], [39.4, 89.0], [39.5, 89.0], [39.6, 89.0], [39.7, 89.0], [39.8, 89.0], [39.9, 89.0], [40.0, 89.0], [40.1, 89.0], [40.2, 90.0], [40.3, 90.0], [40.4, 90.0], [40.5, 90.0], [40.6, 90.0], [40.7, 90.0], [40.8, 91.0], [40.9, 91.0], [41.0, 91.0], [41.1, 92.0], [41.2, 92.0], [41.3, 92.0], [41.4, 92.0], [41.5, 92.0], [41.6, 92.0], [41.7, 92.0], [41.8, 92.0], [41.9, 92.0], [42.0, 93.0], [42.1, 93.0], [42.2, 93.0], [42.3, 94.0], [42.4, 94.0], [42.5, 94.0], [42.6, 94.0], [42.7, 94.0], [42.8, 95.0], [42.9, 95.0], [43.0, 95.0], [43.1, 95.0], [43.2, 95.0], [43.3, 95.0], [43.4, 95.0], [43.5, 95.0], [43.6, 96.0], [43.7, 96.0], [43.8, 97.0], [43.9, 98.0], [44.0, 98.0], [44.1, 99.0], [44.2, 99.0], [44.3, 99.0], [44.4, 101.0], [44.5, 101.0], [44.6, 101.0], [44.7, 102.0], [44.8, 102.0], [44.9, 102.0], [45.0, 102.0], [45.1, 103.0], [45.2, 103.0], [45.3, 103.0], [45.4, 103.0], [45.5, 104.0], [45.6, 105.0], [45.7, 106.0], [45.8, 107.0], [45.9, 107.0], [46.0, 108.0], [46.1, 110.0], [46.2, 110.0], [46.3, 112.0], [46.4, 113.0], [46.5, 114.0], [46.6, 114.0], [46.7, 117.0], [46.8, 118.0], [46.9, 119.0], [47.0, 119.0], [47.1, 121.0], [47.2, 123.0], [47.3, 124.0], [47.4, 126.0], [47.5, 126.0], [47.6, 130.0], [47.7, 130.0], [47.8, 134.0], [47.9, 136.0], [48.0, 137.0], [48.1, 150.0], [48.2, 150.0], [48.3, 154.0], [48.4, 156.0], [48.5, 161.0], [48.6, 181.0], [48.7, 195.0], [48.8, 238.0], [48.9, 252.0], [49.0, 268.0], [49.1, 275.0], [49.2, 282.0], [49.3, 289.0], [49.4, 289.0], [49.5, 293.0], [49.6, 326.0], [49.7, 387.0], [49.8, 2127.0], [49.9, 2134.0], [50.0, 2141.0], [50.1, 2165.0], [50.2, 2180.0], [50.3, 2182.0], [50.4, 2184.0], [50.5, 2188.0], [50.6, 2197.0], [50.7, 2211.0], [50.8, 2211.0], [50.9, 2216.0], [51.0, 2216.0], [51.1, 2235.0], [51.2, 2235.0], [51.3, 2257.0], [51.4, 2267.0], [51.5, 2268.0], [51.6, 2282.0], [51.7, 2283.0], [51.8, 2287.0], [51.9, 2297.0], [52.0, 2306.0], [52.1, 2316.0], [52.2, 2323.0], [52.3, 2334.0], [52.4, 2336.0], [52.5, 2340.0], [52.6, 2353.0], [52.7, 2358.0], [52.8, 2358.0], [52.9, 2364.0], [53.0, 2366.0], [53.1, 2374.0], [53.2, 2377.0], [53.3, 2378.0], [53.4, 2385.0], [53.5, 2408.0], [53.6, 2410.0], [53.7, 2413.0], [53.8, 2421.0], [53.9, 2423.0], [54.0, 2432.0], [54.1, 2445.0], [54.2, 2460.0], [54.3, 2464.0], [54.4, 2469.0], [54.5, 2474.0], [54.6, 2483.0], [54.7, 2485.0], [54.8, 2486.0], [54.9, 2493.0], [55.0, 2501.0], [55.1, 2525.0], [55.2, 2528.0], [55.3, 2530.0], [55.4, 2531.0], [55.5, 2536.0], [55.6, 2552.0], [55.7, 2559.0], [55.8, 2562.0], [55.9, 2565.0], [56.0, 2568.0], [56.1, 2577.0], [56.2, 2583.0], [56.3, 2589.0], [56.4, 2602.0], [56.5, 2609.0], [56.6, 2618.0], [56.7, 2619.0], [56.8, 2620.0], [56.9, 2628.0], [57.0, 2629.0], [57.1, 2630.0], [57.2, 2631.0], [57.3, 2632.0], [57.4, 2633.0], [57.5, 2633.0], [57.6, 2633.0], [57.7, 2633.0], [57.8, 2633.0], [57.9, 2633.0], [58.0, 2633.0], [58.1, 2634.0], [58.2, 2634.0], [58.3, 2635.0], [58.4, 2636.0], [58.5, 2636.0], [58.6, 2636.0], [58.7, 2637.0], [58.8, 2638.0], [58.9, 2638.0], [59.0, 2638.0], [59.1, 2641.0], [59.2, 2643.0], [59.3, 2645.0], [59.4, 2647.0], [59.5, 2649.0], [59.6, 2650.0], [59.7, 2650.0], [59.8, 2653.0], [59.9, 2654.0], [60.0, 2654.0], [60.1, 2662.0], [60.2, 2665.0], [60.3, 2667.0], [60.4, 2667.0], [60.5, 2669.0], [60.6, 3659.0], [60.7, 3669.0], [60.8, 3685.0], [60.9, 3712.0], [61.0, 3716.0], [61.1, 3741.0], [61.2, 3742.0], [61.3, 3746.0], [61.4, 3780.0], [61.5, 3782.0], [61.6, 3805.0], [61.7, 3807.0], [61.8, 3822.0], [61.9, 3826.0], [62.0, 3853.0], [62.1, 3862.0], [62.2, 3867.0], [62.3, 3870.0], [62.4, 3870.0], [62.5, 3872.0], [62.6, 3881.0], [62.7, 3881.0], [62.8, 3882.0], [62.9, 3885.0], [63.0, 3885.0], [63.1, 3885.0], [63.2, 3886.0], [63.3, 3886.0], [63.4, 3886.0], [63.5, 3886.0], [63.6, 3886.0], [63.7, 3886.0], [63.8, 3887.0], [63.9, 3887.0], [64.0, 3889.0], [64.1, 3890.0], [64.2, 3893.0], [64.3, 3893.0], [64.4, 3894.0], [64.5, 3894.0], [64.6, 3894.0], [64.7, 3894.0], [64.8, 3895.0], [64.9, 3895.0], [65.0, 3895.0], [65.1, 3895.0], [65.2, 3896.0], [65.3, 3896.0], [65.4, 3897.0], [65.5, 3897.0], [65.6, 3899.0], [65.7, 3899.0], [65.8, 3899.0], [65.9, 3899.0], [66.0, 3900.0], [66.1, 3901.0], [66.2, 3901.0], [66.3, 3901.0], [66.4, 3901.0], [66.5, 3901.0], [66.6, 3901.0], [66.7, 3901.0], [66.8, 3902.0], [66.9, 3902.0], [67.0, 3902.0], [67.1, 3902.0], [67.2, 3904.0], [67.3, 3905.0], [67.4, 3907.0], [67.5, 3907.0], [67.6, 3909.0], [67.7, 3911.0], [67.8, 3913.0], [67.9, 3914.0], [68.0, 3915.0], [68.1, 3916.0], [68.2, 3916.0], [68.3, 3917.0], [68.4, 3918.0], [68.5, 3922.0], [68.6, 3923.0], [68.7, 3924.0], [68.8, 3926.0], [68.9, 3928.0], [69.0, 3933.0], [69.1, 3934.0], [69.2, 3941.0], [69.3, 3941.0], [69.4, 3983.0], [69.5, 4236.0], [69.6, 25955.0], [69.7, 25960.0], [69.8, 36202.0], [69.9, 36208.0], [70.0, 36218.0], [70.1, 36228.0], [70.2, 36231.0], [70.3, 36233.0], [70.4, 36234.0], [70.5, 36236.0], [70.6, 36237.0], [70.7, 36238.0], [70.8, 36239.0], [70.9, 36240.0], [71.0, 36241.0], [71.1, 36242.0], [71.2, 36243.0], [71.3, 36243.0], [71.4, 36243.0], [71.5, 36243.0], [71.6, 36245.0], [71.7, 36246.0], [71.8, 36247.0], [71.9, 36248.0], [72.0, 36249.0], [72.1, 36251.0], [72.2, 36252.0], [72.3, 36252.0], [72.4, 36253.0], [72.5, 36253.0], [72.6, 36254.0], [72.7, 36254.0], [72.8, 36254.0], [72.9, 36255.0], [73.0, 36255.0], [73.1, 36260.0], [73.2, 36260.0], [73.3, 36260.0], [73.4, 36264.0], [73.5, 36266.0], [73.6, 36268.0], [73.7, 36269.0], [73.8, 36269.0], [73.9, 36270.0], [74.0, 36270.0], [74.1, 36272.0], [74.2, 36272.0], [74.3, 36273.0], [74.4, 36274.0], [74.5, 36275.0], [74.6, 36276.0], [74.7, 36281.0], [74.8, 36282.0], [74.9, 36283.0], [75.0, 36283.0], [75.1, 36284.0], [75.2, 36285.0], [75.3, 36285.0], [75.4, 36286.0], [75.5, 36287.0], [75.6, 36290.0], [75.7, 36290.0], [75.8, 36290.0], [75.9, 36291.0], [76.0, 36291.0], [76.1, 36291.0], [76.2, 36292.0], [76.3, 36292.0], [76.4, 36292.0], [76.5, 36292.0], [76.6, 36294.0], [76.7, 36294.0], [76.8, 36295.0], [76.9, 36296.0], [77.0, 36297.0], [77.1, 36297.0], [77.2, 36298.0], [77.3, 36298.0], [77.4, 36299.0], [77.5, 36300.0], [77.6, 36301.0], [77.7, 36301.0], [77.8, 36301.0], [77.9, 36302.0], [78.0, 36302.0], [78.1, 36302.0], [78.2, 36302.0], [78.3, 36303.0], [78.4, 36303.0], [78.5, 36304.0], [78.6, 36305.0], [78.7, 36305.0], [78.8, 36305.0], [78.9, 36306.0], [79.0, 36306.0], [79.1, 36308.0], [79.2, 36308.0], [79.3, 36309.0], [79.4, 36309.0], [79.5, 36310.0], [79.6, 36310.0], [79.7, 36311.0], [79.8, 36311.0], [79.9, 36312.0], [80.0, 36312.0], [80.1, 36312.0], [80.2, 36312.0], [80.3, 36312.0], [80.4, 36313.0], [80.5, 36313.0], [80.6, 36314.0], [80.7, 36314.0], [80.8, 36314.0], [80.9, 36315.0], [81.0, 36315.0], [81.1, 36315.0], [81.2, 36315.0], [81.3, 36315.0], [81.4, 36316.0], [81.5, 36316.0], [81.6, 36317.0], [81.7, 36317.0], [81.8, 36317.0], [81.9, 36318.0], [82.0, 36319.0], [82.1, 36321.0], [82.2, 36321.0], [82.3, 36321.0], [82.4, 36321.0], [82.5, 36321.0], [82.6, 36321.0], [82.7, 36322.0], [82.8, 36322.0], [82.9, 36324.0], [83.0, 36324.0], [83.1, 36324.0], [83.2, 36324.0], [83.3, 36325.0], [83.4, 36326.0], [83.5, 36326.0], [83.6, 36327.0], [83.7, 36327.0], [83.8, 36328.0], [83.9, 36329.0], [84.0, 36329.0], [84.1, 36329.0], [84.2, 36329.0], [84.3, 36330.0], [84.4, 36330.0], [84.5, 36331.0], [84.6, 36332.0], [84.7, 36332.0], [84.8, 36332.0], [84.9, 36333.0], [85.0, 36334.0], [85.1, 36335.0], [85.2, 36335.0], [85.3, 36336.0], [85.4, 36336.0], [85.5, 36337.0], [85.6, 36337.0], [85.7, 36338.0], [85.8, 36338.0], [85.9, 36338.0], [86.0, 36338.0], [86.1, 36339.0], [86.2, 36339.0], [86.3, 36339.0], [86.4, 36339.0], [86.5, 36340.0], [86.6, 36341.0], [86.7, 36341.0], [86.8, 36342.0], [86.9, 36342.0], [87.0, 36343.0], [87.1, 36343.0], [87.2, 36343.0], [87.3, 36345.0], [87.4, 36345.0], [87.5, 36346.0], [87.6, 36346.0], [87.7, 36346.0], [87.8, 36346.0], [87.9, 36348.0], [88.0, 36348.0], [88.1, 36349.0], [88.2, 36349.0], [88.3, 36350.0], [88.4, 36350.0], [88.5, 36350.0], [88.6, 36353.0], [88.7, 36353.0], [88.8, 36353.0], [88.9, 36353.0], [89.0, 36353.0], [89.1, 36355.0], [89.2, 36355.0], [89.3, 36356.0], [89.4, 36356.0], [89.5, 36357.0], [89.6, 36359.0], [89.7, 36359.0], [89.8, 36359.0], [89.9, 36359.0], [90.0, 36360.0], [90.1, 36361.0], [90.2, 36362.0], [90.3, 36362.0], [90.4, 36365.0], [90.5, 36366.0], [90.6, 36371.0], [90.7, 36371.0], [90.8, 36372.0], [90.9, 36373.0], [91.0, 36375.0], [91.1, 36375.0], [91.2, 36375.0], [91.3, 36376.0], [91.4, 36376.0], [91.5, 36376.0], [91.6, 36382.0], [91.7, 36386.0], [91.8, 36386.0], [91.9, 36388.0], [92.0, 36389.0], [92.1, 36392.0], [92.2, 36394.0], [92.3, 36395.0], [92.4, 36396.0], [92.5, 36398.0], [92.6, 36400.0], [92.7, 36400.0], [92.8, 36402.0], [92.9, 36404.0], [93.0, 36404.0], [93.1, 36407.0], [93.2, 36407.0], [93.3, 36413.0], [93.4, 36414.0], [93.5, 36415.0], [93.6, 36418.0], [93.7, 36421.0], [93.8, 36425.0], [93.9, 36425.0], [94.0, 36430.0], [94.1, 36430.0], [94.2, 36431.0], [94.3, 36432.0], [94.4, 36433.0], [94.5, 36433.0], [94.6, 36437.0], [94.7, 36438.0], [94.8, 36443.0], [94.9, 36446.0], [95.0, 36450.0], [95.1, 36456.0], [95.2, 36461.0], [95.3, 36461.0], [95.4, 36464.0], [95.5, 36465.0], [95.6, 36468.0], [95.7, 36468.0], [95.8, 36470.0], [95.9, 36470.0], [96.0, 36471.0], [96.1, 36472.0], [96.2, 36474.0], [96.3, 36477.0], [96.4, 36480.0], [96.5, 36481.0], [96.6, 36487.0], [96.7, 36488.0], [96.8, 36489.0], [96.9, 36490.0], [97.0, 36494.0], [97.1, 36498.0], [97.2, 36508.0], [97.3, 36509.0], [97.4, 36510.0], [97.5, 36512.0], [97.6, 36513.0], [97.7, 36515.0], [97.8, 36517.0], [97.9, 36521.0], [98.0, 36529.0], [98.1, 36532.0], [98.2, 36534.0], [98.3, 36534.0], [98.4, 36537.0], [98.5, 36543.0], [98.6, 36547.0], [98.7, 36547.0], [98.8, 36550.0], [98.9, 36554.0], [99.0, 36571.0], [99.1, 36595.0], [99.2, 36612.0], [99.3, 36617.0], [99.4, 36618.0], [99.5, 36651.0], [99.6, 36680.0], [99.7, 36687.0], [99.8, 42054.0], [99.9, 42077.0]], "isOverall": false, "label": "HomePage", "isController": false}], "supportsControllersDiscrimination": true, "maxX": 100.0, "title": "Response Time Percentiles"}},
        getOptions: function() {
            return {
                series: {
                    points: { show: false }
                },
                legend: {
                    noColumns: 2,
                    show: true,
                    container: '#legendResponseTimePercentiles'
                },
                xaxis: {
                    tickDecimals: 1,
                    axisLabel: "Percentiles",
                    axisLabelUseCanvas: true,
                    axisLabelFontSizePixels: 12,
                    axisLabelFontFamily: 'Verdana, Arial',
                    axisLabelPadding: 20,
                },
                yaxis: {
                    axisLabel: "Percentile value in ms",
                    axisLabelUseCanvas: true,
                    axisLabelFontSizePixels: 12,
                    axisLabelFontFamily: 'Verdana, Arial',
                    axisLabelPadding: 20
                },
                grid: {
                    hoverable: true // IMPORTANT! this is needed for tooltip to
                                    // work
                },
                tooltip: true,
                tooltipOpts: {
                    content: "%s : %x.2 percentile was %y ms"
                },
                selection: { mode: "xy" },
            };
        },
        createGraph: function() {
            var data = this.data;
            var dataset = prepareData(data.result.series, $("#choicesResponseTimePercentiles"));
            var options = this.getOptions();
            prepareOptions(options, data);
            $.plot($("#flotResponseTimesPercentiles"), dataset, options);
            // setup overview
            $.plot($("#overviewResponseTimesPercentiles"), dataset, prepareOverviewOptions(options));
        }
};

/**
 * @param elementId Id of element where we display message
 */
function setEmptyGraph(elementId) {
    $(function() {
        $(elementId).text("No graph series with filter="+seriesFilter);
    });
}

// Response times percentiles
function refreshResponseTimePercentiles() {
    var infos = responseTimePercentilesInfos;
    prepareSeries(infos.data);
    if(infos.data.result.series.length == 0) {
        setEmptyGraph("#bodyResponseTimePercentiles");
        return;
    }
    if (isGraph($("#flotResponseTimesPercentiles"))){
        infos.createGraph();
    } else {
        var choiceContainer = $("#choicesResponseTimePercentiles");
        createLegend(choiceContainer, infos);
        infos.createGraph();
        setGraphZoomable("#flotResponseTimesPercentiles", "#overviewResponseTimesPercentiles");
        $('#bodyResponseTimePercentiles .legendColorBox > div').each(function(i){
            $(this).clone().prependTo(choiceContainer.find("li").eq(i));
        });
    }
}

var responseTimeDistributionInfos = {
        data: {"result": {"minY": 1.0, "minX": 0.0, "maxY": 532.0, "series": [{"data": [[0.0, 532.0], [2100.0, 11.0], [36200.0, 92.0], [36300.0, 182.0], [36400.0, 55.0], [36500.0, 24.0], [36600.0, 7.0], [2300.0, 18.0], [2200.0, 15.0], [2400.0, 18.0], [2500.0, 17.0], [42000.0, 3.0], [2600.0, 51.0], [200.0, 9.0], [3700.0, 9.0], [3600.0, 3.0], [3800.0, 52.0], [3900.0, 42.0], [4200.0, 1.0], [300.0, 3.0], [100.0, 53.0], [25900.0, 3.0]], "isOverall": false, "label": "HomePage", "isController": false}], "supportsControllersDiscrimination": true, "granularity": 100, "maxX": 42000.0, "title": "Response Time Distribution"}},
        getOptions: function() {
            var granularity = this.data.result.granularity;
            return {
                legend: {
                    noColumns: 2,
                    show: true,
                    container: '#legendResponseTimeDistribution'
                },
                xaxis:{
                    axisLabel: "Response times in ms",
                    axisLabelUseCanvas: true,
                    axisLabelFontSizePixels: 12,
                    axisLabelFontFamily: 'Verdana, Arial',
                    axisLabelPadding: 20,
                },
                yaxis: {
                    axisLabel: "Number of responses",
                    axisLabelUseCanvas: true,
                    axisLabelFontSizePixels: 12,
                    axisLabelFontFamily: 'Verdana, Arial',
                    axisLabelPadding: 20,
                },
                bars : {
                    show: true,
                    barWidth: this.data.result.granularity
                },
                grid: {
                    hoverable: true // IMPORTANT! this is needed for tooltip to
                                    // work
                },
                tooltip: true,
                tooltipOpts: {
                    content: function(label, xval, yval, flotItem){
                        return yval + " responses for " + label + " were between " + xval + " and " + (xval + granularity) + " ms";
                    }
                }
            };
        },
        createGraph: function() {
            var data = this.data;
            var options = this.getOptions();
            prepareOptions(options, data);
            $.plot($("#flotResponseTimeDistribution"), prepareData(data.result.series, $("#choicesResponseTimeDistribution")), options);
        }

};

// Response time distribution
function refreshResponseTimeDistribution() {
    var infos = responseTimeDistributionInfos;
    prepareSeries(infos.data);
    if(infos.data.result.series.length == 0) {
        setEmptyGraph("#bodyResponseTimeDistribution");
        return;
    }
    if (isGraph($("#flotResponseTimeDistribution"))){
        infos.createGraph();
    }else{
        var choiceContainer = $("#choicesResponseTimeDistribution");
        createLegend(choiceContainer, infos);
        infos.createGraph();
        $('#footerResponseTimeDistribution .legendColorBox > div').each(function(i){
            $(this).clone().prependTo(choiceContainer.find("li").eq(i));
        });
    }
};


var syntheticResponseTimeDistributionInfos = {
        data: {"result": {"minY": 3.0, "minX": 0.0, "ticks": [[0, "Requests having \nresponse time <= 500ms"], [1, "Requests having \nresponse time > 500ms and <= 1,500ms"], [2, "Requests having \nresponse time > 1,500ms"], [3, "Requests in error"]], "maxY": 600.0, "series": [{"data": [[0.0, 597.0]], "color": "#9ACD32", "isOverall": false, "label": "Requests having \nresponse time <= 500ms", "isController": false}, {"data": [], "color": "yellow", "isOverall": false, "label": "Requests having \nresponse time > 500ms and <= 1,500ms", "isController": false}, {"data": [[2.0, 600.0]], "color": "orange", "isOverall": false, "label": "Requests having \nresponse time > 1,500ms", "isController": false}, {"data": [[3.0, 3.0]], "color": "#FF6347", "isOverall": false, "label": "Requests in error", "isController": false}], "supportsControllersDiscrimination": false, "maxX": 3.0, "title": "Synthetic Response Times Distribution"}},
        getOptions: function() {
            return {
                legend: {
                    noColumns: 2,
                    show: true,
                    container: '#legendSyntheticResponseTimeDistribution'
                },
                xaxis:{
                    axisLabel: "Response times ranges",
                    axisLabelUseCanvas: true,
                    axisLabelFontSizePixels: 12,
                    axisLabelFontFamily: 'Verdana, Arial',
                    axisLabelPadding: 20,
                    tickLength:0,
                    min:-0.5,
                    max:3.5
                },
                yaxis: {
                    axisLabel: "Number of responses",
                    axisLabelUseCanvas: true,
                    axisLabelFontSizePixels: 12,
                    axisLabelFontFamily: 'Verdana, Arial',
                    axisLabelPadding: 20,
                },
                bars : {
                    show: true,
                    align: "center",
                    barWidth: 0.25,
                    fill:.75
                },
                grid: {
                    hoverable: true // IMPORTANT! this is needed for tooltip to
                                    // work
                },
                tooltip: true,
                tooltipOpts: {
                    content: function(label, xval, yval, flotItem){
                        return yval + " " + label;
                    }
                }
            };
        },
        createGraph: function() {
            var data = this.data;
            var options = this.getOptions();
            prepareOptions(options, data);
            options.xaxis.ticks = data.result.ticks;
            $.plot($("#flotSyntheticResponseTimeDistribution"), prepareData(data.result.series, $("#choicesSyntheticResponseTimeDistribution")), options);
        }

};

// Response time distribution
function refreshSyntheticResponseTimeDistribution() {
    var infos = syntheticResponseTimeDistributionInfos;
    prepareSeries(infos.data, true);
    if (isGraph($("#flotSyntheticResponseTimeDistribution"))){
        infos.createGraph();
    }else{
        var choiceContainer = $("#choicesSyntheticResponseTimeDistribution");
        createLegend(choiceContainer, infos);
        infos.createGraph();
        $('#footerSyntheticResponseTimeDistribution .legendColorBox > div').each(function(i){
            $(this).clone().prependTo(choiceContainer.find("li").eq(i));
        });
    }
};

var activeThreadsOverTimeInfos = {
        data: {"result": {"minY": 3.0, "minX": 1.76395908E12, "maxY": 294.95384615384603, "series": [{"data": [[1.76395914E12, 3.0], [1.7639595E12, 294.95384615384603], [1.76395908E12, 169.19262981574545], [1.76395956E12, 93.00000000000001]], "isOverall": false, "label": "Thread Group", "isController": false}], "supportsControllersDiscrimination": false, "granularity": 60000, "maxX": 1.76395956E12, "title": "Active Threads Over Time"}},
        getOptions: function() {
            return {
                series: {
                    stack: true,
                    lines: {
                        show: true,
                        fill: true
                    },
                    points: {
                        show: true
                    }
                },
                xaxis: {
                    mode: "time",
                    timeformat: getTimeFormat(this.data.result.granularity),
                    axisLabel: getElapsedTimeLabel(this.data.result.granularity),
                    axisLabelUseCanvas: true,
                    axisLabelFontSizePixels: 12,
                    axisLabelFontFamily: 'Verdana, Arial',
                    axisLabelPadding: 20,
                },
                yaxis: {
                    axisLabel: "Number of active threads",
                    axisLabelUseCanvas: true,
                    axisLabelFontSizePixels: 12,
                    axisLabelFontFamily: 'Verdana, Arial',
                    axisLabelPadding: 20
                },
                legend: {
                    noColumns: 6,
                    show: true,
                    container: '#legendActiveThreadsOverTime'
                },
                grid: {
                    hoverable: true // IMPORTANT! this is needed for tooltip to
                                    // work
                },
                selection: {
                    mode: 'xy'
                },
                tooltip: true,
                tooltipOpts: {
                    content: "%s : At %x there were %y active threads"
                }
            };
        },
        createGraph: function() {
            var data = this.data;
            var dataset = prepareData(data.result.series, $("#choicesActiveThreadsOverTime"));
            var options = this.getOptions();
            prepareOptions(options, data);
            $.plot($("#flotActiveThreadsOverTime"), dataset, options);
            // setup overview
            $.plot($("#overviewActiveThreadsOverTime"), dataset, prepareOverviewOptions(options));
        }
};

// Active Threads Over Time
function refreshActiveThreadsOverTime(fixTimestamps) {
    var infos = activeThreadsOverTimeInfos;
    prepareSeries(infos.data);
    if(fixTimestamps) {
        fixTimeStamps(infos.data.result.series, 19800000);
    }
    if(isGraph($("#flotActiveThreadsOverTime"))) {
        infos.createGraph();
    }else{
        var choiceContainer = $("#choicesActiveThreadsOverTime");
        createLegend(choiceContainer, infos);
        infos.createGraph();
        setGraphZoomable("#flotActiveThreadsOverTime", "#overviewActiveThreadsOverTime");
        $('#footerActiveThreadsOverTime .legendColorBox > div').each(function(i){
            $(this).clone().prependTo(choiceContainer.find("li").eq(i));
        });
    }
};

var timeVsThreadsInfos = {
        data: {"result": {"minY": 56.0, "minX": 1.0, "maxY": 36336.0, "series": [{"data": [[2.0, 79.0], [3.0, 34012.833333333336], [4.0, 106.66666666666667], [5.0, 130.0], [6.0, 67.0], [7.0, 61.5], [8.0, 12273.0], [9.0, 70.0], [10.0, 80.0], [11.0, 65.5], [12.0, 18170.5], [13.0, 9110.75], [14.0, 18159.0], [15.0, 12158.333333333332], [16.0, 65.33333333333333], [17.0, 12214.666666666668], [18.0, 21859.0], [20.0, 12138.5], [21.0, 12122.333333333332], [22.0, 18171.75], [23.0, 65.5], [24.0, 18297.5], [25.0, 27305.5], [26.0, 14601.8], [27.0, 24184.333333333332], [28.0, 9102.5], [29.0, 18209.75], [30.0, 18154.5], [31.0, 12109.333333333332], [33.0, 29048.2], [32.0, 18236.5], [35.0, 20750.285714285714], [34.0, 24181.0], [37.0, 7304.2], [36.0, 36336.0], [39.0, 18171.75], [38.0, 18188.0], [40.0, 80.0], [43.0, 20790.85714285714], [42.0, 15588.42857142857], [45.0, 14588.0], [44.0, 24417.666666666664], [47.0, 65.33333333333333], [46.0, 58.0], [48.0, 29102.600000000002], [49.0, 29056.6], [50.0, 9106.25], [53.0, 12184.166666666668], [52.0, 12150.0], [54.0, 18147.0], [55.0, 12156.0], [57.0, 18187.25], [56.0, 14570.4], [58.0, 77.0], [61.0, 10439.142857142857], [60.0, 12375.0], [63.0, 57.0], [62.0, 18218.0], [67.0, 23239.454545454544], [65.0, 70.33333333333333], [64.0, 12123.333333333332], [70.0, 12134.0], [69.0, 18243.25], [68.0, 56.0], [71.0, 119.0], [75.0, 18187.0], [73.0, 10423.0], [74.0, 99.0], [79.0, 18209.666666666664], [78.0, 12148.0], [77.0, 27257.500000000004], [76.0, 27252.25], [83.0, 12161.0], [80.0, 21809.0], [82.0, 80.0], [81.0, 82.0], [87.0, 73.0], [86.0, 25466.400000000005], [84.0, 21827.0], [85.0, 76.0], [91.0, 6130.0], [90.0, 27276.0], [89.0, 33018.00000000001], [88.0, 21849.2], [95.0, 77.5], [94.0, 78.0], [92.0, 70.0], [93.0, 64.0], [99.0, 76.5], [98.0, 12164.333333333332], [97.0, 74.0], [100.0, 75.0], [103.0, 18245.583333333332], [101.0, 69.0], [107.0, 9136.25], [106.0, 30815.230769230773], [104.0, 18312.333333333332], [105.0, 101.0], [111.0, 24235.666666666668], [110.0, 24246.5], [109.0, 62.75], [108.0, 21841.4], [115.0, 18160.5], [114.0, 21854.8], [113.0, 22402.53846153846], [119.0, 24237.833333333336], [118.0, 7305.6], [117.0, 27371.0], [116.0, 89.0], [123.0, 9219.75], [122.0, 82.0], [121.0, 25448.8], [120.0, 30383.5], [127.0, 12166.333333333332], [126.0, 12189.333333333332], [125.0, 24206.0], [124.0, 31173.71428571429], [135.0, 152.0], [134.0, 18371.833333333332], [133.0, 18199.0], [132.0, 12237.0], [129.0, 27305.5], [128.0, 24272.333333333332], [130.0, 21869.2], [143.0, 77.0], [141.0, 9198.0], [140.0, 75.0], [138.0, 18258.0], [137.0, 12177.333333333334], [136.0, 12263.333333333332], [142.0, 24304.0], [139.0, 195.0], [151.0, 12177.5], [150.0, 24259.0], [149.0, 12226.0], [147.0, 12185.0], [146.0, 24266.166666666664], [145.0, 6118.5], [148.0, 24307.0], [144.0, 12187.0], [159.0, 68.5], [157.0, 67.5], [155.0, 9143.5], [153.0, 82.0], [152.0, 18208.0], [158.0, 94.0], [156.0, 81.0], [154.0, 92.0], [167.0, 12145.333333333332], [162.0, 21826.4], [161.0, 18187.75], [160.0, 22752.75], [166.0, 65.5], [165.0, 36302.0], [164.0, 24252.666666666664], [163.0, 18183.0], [173.0, 83.0], [172.0, 82.0], [171.0, 155.5], [170.0, 27254.799999999996], [169.0, 24221.666666666664], [168.0, 27276.25], [183.0, 24279.333333333336], [182.0, 33381.66666666667], [181.0, 18284.5], [180.0, 30364.333333333336], [179.0, 18232.0], [178.0, 32797.8], [177.0, 14589.8], [176.0, 29778.727272727272], [191.0, 77.0], [190.0, 79.0], [189.0, 18191.5], [188.0, 95.0], [187.0, 81.0], [186.0, 27254.5], [185.0, 103.0], [184.0, 117.0], [199.0, 108.0], [197.0, 134.0], [196.0, 137.0], [195.0, 2281.0], [194.0, 64.0], [193.0, 18188.0], [192.0, 33068.36363636364], [200.0, 67.5], [239.0, 102.0], [237.0, 90.0], [236.0, 93.33333333333333], [233.0, 89.5], [247.0, 87.8], [242.0, 88.0], [249.0, 86.2], [248.0, 85.0], [271.0, 81.07692307692308], [264.0, 82.0], [262.0, 78.0], [285.0, 71.73333333333333], [284.0, 64.5], [280.0, 112.0], [286.0, 68.5], [287.0, 66.5], [283.0, 124.33333333333333], [290.0, 84.0], [300.0, 2902.8095238095234], [293.0, 72.96296296296296], [299.0, 59.14285714285714], [298.0, 60.5], [297.0, 62.333333333333336], [295.0, 65.5], [289.0, 85.4], [288.0, 160.42424242424244], [294.0, 66.2], [292.0, 80.57142857142857], [291.0, 82.54545454545455], [1.0, 64.0]], "isOverall": false, "label": "HomePage", "isController": false}, {"data": [[174.4350000000003, 11731.614166666675]], "isOverall": false, "label": "HomePage-Aggregated", "isController": false}], "supportsControllersDiscrimination": true, "maxX": 300.0, "title": "Time VS Threads"}},
        getOptions: function() {
            return {
                series: {
                    lines: {
                        show: true
                    },
                    points: {
                        show: true
                    }
                },
                xaxis: {
                    axisLabel: "Number of active threads",
                    axisLabelUseCanvas: true,
                    axisLabelFontSizePixels: 12,
                    axisLabelFontFamily: 'Verdana, Arial',
                    axisLabelPadding: 20,
                },
                yaxis: {
                    axisLabel: "Average response times in ms",
                    axisLabelUseCanvas: true,
                    axisLabelFontSizePixels: 12,
                    axisLabelFontFamily: 'Verdana, Arial',
                    axisLabelPadding: 20
                },
                legend: { noColumns: 2,show: true, container: '#legendTimeVsThreads' },
                selection: {
                    mode: 'xy'
                },
                grid: {
                    hoverable: true // IMPORTANT! this is needed for tooltip to work
                },
                tooltip: true,
                tooltipOpts: {
                    content: "%s: At %x.2 active threads, Average response time was %y.2 ms"
                }
            };
        },
        createGraph: function() {
            var data = this.data;
            var dataset = prepareData(data.result.series, $("#choicesTimeVsThreads"));
            var options = this.getOptions();
            prepareOptions(options, data);
            $.plot($("#flotTimesVsThreads"), dataset, options);
            // setup overview
            $.plot($("#overviewTimesVsThreads"), dataset, prepareOverviewOptions(options));
        }
};

// Time vs threads
function refreshTimeVsThreads(){
    var infos = timeVsThreadsInfos;
    prepareSeries(infos.data);
    if(infos.data.result.series.length == 0) {
        setEmptyGraph("#bodyTimeVsThreads");
        return;
    }
    if(isGraph($("#flotTimesVsThreads"))){
        infos.createGraph();
    }else{
        var choiceContainer = $("#choicesTimeVsThreads");
        createLegend(choiceContainer, infos);
        infos.createGraph();
        setGraphZoomable("#flotTimesVsThreads", "#overviewTimesVsThreads");
        $('#footerTimeVsThreads .legendColorBox > div').each(function(i){
            $(this).clone().prependTo(choiceContainer.find("li").eq(i));
        });
    }
};

var bytesThroughputOverTimeInfos = {
        data : {"result": {"minY": 9.45, "minX": 1.76395908E12, "maxY": 15247.033333333333, "series": [{"data": [[1.76395914E12, 76.23333333333333], [1.7639595E12, 6607.916666666667], [1.76395908E12, 15247.033333333333], [1.76395956E12, 8641.333333333334]], "isOverall": false, "label": "Bytes received per second", "isController": false}, {"data": [[1.76395914E12, 9.45], [1.7639595E12, 819.0], [1.76395908E12, 1871.1], [1.76395956E12, 1071.0]], "isOverall": false, "label": "Bytes sent per second", "isController": false}], "supportsControllersDiscrimination": false, "granularity": 60000, "maxX": 1.76395956E12, "title": "Bytes Throughput Over Time"}},
        getOptions : function(){
            return {
                series: {
                    lines: {
                        show: true
                    },
                    points: {
                        show: true
                    }
                },
                xaxis: {
                    mode: "time",
                    timeformat: getTimeFormat(this.data.result.granularity),
                    axisLabel: getElapsedTimeLabel(this.data.result.granularity) ,
                    axisLabelUseCanvas: true,
                    axisLabelFontSizePixels: 12,
                    axisLabelFontFamily: 'Verdana, Arial',
                    axisLabelPadding: 20,
                },
                yaxis: {
                    axisLabel: "Bytes / sec",
                    axisLabelUseCanvas: true,
                    axisLabelFontSizePixels: 12,
                    axisLabelFontFamily: 'Verdana, Arial',
                    axisLabelPadding: 20,
                },
                legend: {
                    noColumns: 2,
                    show: true,
                    container: '#legendBytesThroughputOverTime'
                },
                selection: {
                    mode: "xy"
                },
                grid: {
                    hoverable: true // IMPORTANT! this is needed for tooltip to
                                    // work
                },
                tooltip: true,
                tooltipOpts: {
                    content: "%s at %x was %y"
                }
            };
        },
        createGraph : function() {
            var data = this.data;
            var dataset = prepareData(data.result.series, $("#choicesBytesThroughputOverTime"));
            var options = this.getOptions();
            prepareOptions(options, data);
            $.plot($("#flotBytesThroughputOverTime"), dataset, options);
            // setup overview
            $.plot($("#overviewBytesThroughputOverTime"), dataset, prepareOverviewOptions(options));
        }
};

// Bytes throughput Over Time
function refreshBytesThroughputOverTime(fixTimestamps) {
    var infos = bytesThroughputOverTimeInfos;
    prepareSeries(infos.data);
    if(fixTimestamps) {
        fixTimeStamps(infos.data.result.series, 19800000);
    }
    if(isGraph($("#flotBytesThroughputOverTime"))){
        infos.createGraph();
    }else{
        var choiceContainer = $("#choicesBytesThroughputOverTime");
        createLegend(choiceContainer, infos);
        infos.createGraph();
        setGraphZoomable("#flotBytesThroughputOverTime", "#overviewBytesThroughputOverTime");
        $('#footerBytesThroughputOverTime .legendColorBox > div').each(function(i){
            $(this).clone().prependTo(choiceContainer.find("li").eq(i));
        });
    }
}

var responseTimesOverTimeInfos = {
        data: {"result": {"minY": 1279.1423076923088, "minX": 1.76395908E12, "maxY": 25955.333333333332, "series": [{"data": [[1.76395914E12, 25955.333333333332], [1.7639595E12, 1279.1423076923088], [1.76395908E12, 12506.480737018415], [1.76395956E12, 18238.602941176458]], "isOverall": false, "label": "HomePage", "isController": false}], "supportsControllersDiscrimination": true, "granularity": 60000, "maxX": 1.76395956E12, "title": "Response Time Over Time"}},
        getOptions: function(){
            return {
                series: {
                    lines: {
                        show: true
                    },
                    points: {
                        show: true
                    }
                },
                xaxis: {
                    mode: "time",
                    timeformat: getTimeFormat(this.data.result.granularity),
                    axisLabel: getElapsedTimeLabel(this.data.result.granularity),
                    axisLabelUseCanvas: true,
                    axisLabelFontSizePixels: 12,
                    axisLabelFontFamily: 'Verdana, Arial',
                    axisLabelPadding: 20,
                },
                yaxis: {
                    axisLabel: "Average response time in ms",
                    axisLabelUseCanvas: true,
                    axisLabelFontSizePixels: 12,
                    axisLabelFontFamily: 'Verdana, Arial',
                    axisLabelPadding: 20,
                },
                legend: {
                    noColumns: 2,
                    show: true,
                    container: '#legendResponseTimesOverTime'
                },
                selection: {
                    mode: 'xy'
                },
                grid: {
                    hoverable: true // IMPORTANT! this is needed for tooltip to
                                    // work
                },
                tooltip: true,
                tooltipOpts: {
                    content: "%s : at %x Average response time was %y ms"
                }
            };
        },
        createGraph: function() {
            var data = this.data;
            var dataset = prepareData(data.result.series, $("#choicesResponseTimesOverTime"));
            var options = this.getOptions();
            prepareOptions(options, data);
            $.plot($("#flotResponseTimesOverTime"), dataset, options);
            // setup overview
            $.plot($("#overviewResponseTimesOverTime"), dataset, prepareOverviewOptions(options));
        }
};

// Response Times Over Time
function refreshResponseTimeOverTime(fixTimestamps) {
    var infos = responseTimesOverTimeInfos;
    prepareSeries(infos.data);
    if(infos.data.result.series.length == 0) {
        setEmptyGraph("#bodyResponseTimeOverTime");
        return;
    }
    if(fixTimestamps) {
        fixTimeStamps(infos.data.result.series, 19800000);
    }
    if(isGraph($("#flotResponseTimesOverTime"))){
        infos.createGraph();
    }else{
        var choiceContainer = $("#choicesResponseTimesOverTime");
        createLegend(choiceContainer, infos);
        infos.createGraph();
        setGraphZoomable("#flotResponseTimesOverTime", "#overviewResponseTimesOverTime");
        $('#footerResponseTimesOverTime .legendColorBox > div').each(function(i){
            $(this).clone().prependTo(choiceContainer.find("li").eq(i));
        });
    }
};

var latenciesOverTimeInfos = {
        data: {"result": {"minY": 1275.9423076923074, "minX": 1.76395908E12, "maxY": 25955.333333333332, "series": [{"data": [[1.76395914E12, 25955.333333333332], [1.7639595E12, 1275.9423076923074], [1.76395908E12, 12294.167504187593], [1.76395956E12, 18238.473529411793]], "isOverall": false, "label": "HomePage", "isController": false}], "supportsControllersDiscrimination": true, "granularity": 60000, "maxX": 1.76395956E12, "title": "Latencies Over Time"}},
        getOptions: function() {
            return {
                series: {
                    lines: {
                        show: true
                    },
                    points: {
                        show: true
                    }
                },
                xaxis: {
                    mode: "time",
                    timeformat: getTimeFormat(this.data.result.granularity),
                    axisLabel: getElapsedTimeLabel(this.data.result.granularity),
                    axisLabelUseCanvas: true,
                    axisLabelFontSizePixels: 12,
                    axisLabelFontFamily: 'Verdana, Arial',
                    axisLabelPadding: 20,
                },
                yaxis: {
                    axisLabel: "Average response latencies in ms",
                    axisLabelUseCanvas: true,
                    axisLabelFontSizePixels: 12,
                    axisLabelFontFamily: 'Verdana, Arial',
                    axisLabelPadding: 20,
                },
                legend: {
                    noColumns: 2,
                    show: true,
                    container: '#legendLatenciesOverTime'
                },
                selection: {
                    mode: 'xy'
                },
                grid: {
                    hoverable: true // IMPORTANT! this is needed for tooltip to
                                    // work
                },
                tooltip: true,
                tooltipOpts: {
                    content: "%s : at %x Average latency was %y ms"
                }
            };
        },
        createGraph: function () {
            var data = this.data;
            var dataset = prepareData(data.result.series, $("#choicesLatenciesOverTime"));
            var options = this.getOptions();
            prepareOptions(options, data);
            $.plot($("#flotLatenciesOverTime"), dataset, options);
            // setup overview
            $.plot($("#overviewLatenciesOverTime"), dataset, prepareOverviewOptions(options));
        }
};

// Latencies Over Time
function refreshLatenciesOverTime(fixTimestamps) {
    var infos = latenciesOverTimeInfos;
    prepareSeries(infos.data);
    if(infos.data.result.series.length == 0) {
        setEmptyGraph("#bodyLatenciesOverTime");
        return;
    }
    if(fixTimestamps) {
        fixTimeStamps(infos.data.result.series, 19800000);
    }
    if(isGraph($("#flotLatenciesOverTime"))) {
        infos.createGraph();
    }else {
        var choiceContainer = $("#choicesLatenciesOverTime");
        createLegend(choiceContainer, infos);
        infos.createGraph();
        setGraphZoomable("#flotLatenciesOverTime", "#overviewLatenciesOverTime");
        $('#footerLatenciesOverTime .legendColorBox > div').each(function(i){
            $(this).clone().prependTo(choiceContainer.find("li").eq(i));
        });
    }
};

var connectTimeOverTimeInfos = {
        data: {"result": {"minY": 1197.6153846153836, "minX": 1.76395908E12, "maxY": 25601.666666666668, "series": [{"data": [[1.76395914E12, 25601.666666666668], [1.7639595E12, 1197.6153846153836], [1.76395908E12, 12417.306532663317], [1.76395956E12, 18147.967647058824]], "isOverall": false, "label": "HomePage", "isController": false}], "supportsControllersDiscrimination": true, "granularity": 60000, "maxX": 1.76395956E12, "title": "Connect Time Over Time"}},
        getOptions: function() {
            return {
                series: {
                    lines: {
                        show: true
                    },
                    points: {
                        show: true
                    }
                },
                xaxis: {
                    mode: "time",
                    timeformat: getTimeFormat(this.data.result.granularity),
                    axisLabel: getConnectTimeLabel(this.data.result.granularity),
                    axisLabelUseCanvas: true,
                    axisLabelFontSizePixels: 12,
                    axisLabelFontFamily: 'Verdana, Arial',
                    axisLabelPadding: 20,
                },
                yaxis: {
                    axisLabel: "Average Connect Time in ms",
                    axisLabelUseCanvas: true,
                    axisLabelFontSizePixels: 12,
                    axisLabelFontFamily: 'Verdana, Arial',
                    axisLabelPadding: 20,
                },
                legend: {
                    noColumns: 2,
                    show: true,
                    container: '#legendConnectTimeOverTime'
                },
                selection: {
                    mode: 'xy'
                },
                grid: {
                    hoverable: true // IMPORTANT! this is needed for tooltip to
                                    // work
                },
                tooltip: true,
                tooltipOpts: {
                    content: "%s : at %x Average connect time was %y ms"
                }
            };
        },
        createGraph: function () {
            var data = this.data;
            var dataset = prepareData(data.result.series, $("#choicesConnectTimeOverTime"));
            var options = this.getOptions();
            prepareOptions(options, data);
            $.plot($("#flotConnectTimeOverTime"), dataset, options);
            // setup overview
            $.plot($("#overviewConnectTimeOverTime"), dataset, prepareOverviewOptions(options));
        }
};

// Connect Time Over Time
function refreshConnectTimeOverTime(fixTimestamps) {
    var infos = connectTimeOverTimeInfos;
    prepareSeries(infos.data);
    if(infos.data.result.series.length == 0) {
        setEmptyGraph("#bodyConnectTimeOverTime");
        return;
    }
    if(fixTimestamps) {
        fixTimeStamps(infos.data.result.series, 19800000);
    }
    if(isGraph($("#flotConnectTimeOverTime"))) {
        infos.createGraph();
    }else {
        var choiceContainer = $("#choicesConnectTimeOverTime");
        createLegend(choiceContainer, infos);
        infos.createGraph();
        setGraphZoomable("#flotConnectTimeOverTime", "#overviewConnectTimeOverTime");
        $('#footerConnectTimeOverTime .legendColorBox > div').each(function(i){
            $(this).clone().prependTo(choiceContainer.find("li").eq(i));
        });
    }
};

var responseTimePercentilesOverTimeInfos = {
        data: {"result": {"minY": 54.0, "minX": 1.76395908E12, "maxY": 36687.0, "series": [{"data": [[1.76395914E12, 25960.0], [1.7639595E12, 2672.0], [1.76395908E12, 36651.0], [1.76395956E12, 36687.0]], "isOverall": false, "label": "Max", "isController": false}, {"data": [[1.76395914E12, 25960.0], [1.7639595E12, 2636.0], [1.76395908E12, 36345.5], [1.76395956E12, 36470.0]], "isOverall": false, "label": "90th percentile", "isController": false}, {"data": [[1.76395914E12, 25960.0], [1.7639595E12, 2667.7799999999997], [1.76395908E12, 36529.6], [1.76395956E12, 36615.54]], "isOverall": false, "label": "99th percentile", "isController": false}, {"data": [[1.76395914E12, 25960.0], [1.7639595E12, 2649.0], [1.76395908E12, 36408.5], [1.76395956E12, 36516.9]], "isOverall": false, "label": "95th percentile", "isController": false}, {"data": [[1.76395914E12, 25951.0], [1.7639595E12, 55.0], [1.76395908E12, 54.0], [1.76395956E12, 57.0]], "isOverall": false, "label": "Min", "isController": false}, {"data": [[1.76395914E12, 25955.0], [1.7639595E12, 1257.0], [1.76395908E12, 1992.5], [1.76395956E12, 18302.0]], "isOverall": false, "label": "Median", "isController": false}], "supportsControllersDiscrimination": false, "granularity": 60000, "maxX": 1.76395956E12, "title": "Response Time Percentiles Over Time (successful requests only)"}},
        getOptions: function() {
            return {
                series: {
                    lines: {
                        show: true,
                        fill: true
                    },
                    points: {
                        show: true
                    }
                },
                xaxis: {
                    mode: "time",
                    timeformat: getTimeFormat(this.data.result.granularity),
                    axisLabel: getElapsedTimeLabel(this.data.result.granularity),
                    axisLabelUseCanvas: true,
                    axisLabelFontSizePixels: 12,
                    axisLabelFontFamily: 'Verdana, Arial',
                    axisLabelPadding: 20,
                },
                yaxis: {
                    axisLabel: "Response Time in ms",
                    axisLabelUseCanvas: true,
                    axisLabelFontSizePixels: 12,
                    axisLabelFontFamily: 'Verdana, Arial',
                    axisLabelPadding: 20,
                },
                legend: {
                    noColumns: 2,
                    show: true,
                    container: '#legendResponseTimePercentilesOverTime'
                },
                selection: {
                    mode: 'xy'
                },
                grid: {
                    hoverable: true // IMPORTANT! this is needed for tooltip to
                                    // work
                },
                tooltip: true,
                tooltipOpts: {
                    content: "%s : at %x Response time was %y ms"
                }
            };
        },
        createGraph: function () {
            var data = this.data;
            var dataset = prepareData(data.result.series, $("#choicesResponseTimePercentilesOverTime"));
            var options = this.getOptions();
            prepareOptions(options, data);
            $.plot($("#flotResponseTimePercentilesOverTime"), dataset, options);
            // setup overview
            $.plot($("#overviewResponseTimePercentilesOverTime"), dataset, prepareOverviewOptions(options));
        }
};

// Response Time Percentiles Over Time
function refreshResponseTimePercentilesOverTime(fixTimestamps) {
    var infos = responseTimePercentilesOverTimeInfos;
    prepareSeries(infos.data);
    if(fixTimestamps) {
        fixTimeStamps(infos.data.result.series, 19800000);
    }
    if(isGraph($("#flotResponseTimePercentilesOverTime"))) {
        infos.createGraph();
    }else {
        var choiceContainer = $("#choicesResponseTimePercentilesOverTime");
        createLegend(choiceContainer, infos);
        infos.createGraph();
        setGraphZoomable("#flotResponseTimePercentilesOverTime", "#overviewResponseTimePercentilesOverTime");
        $('#footerResponseTimePercentilesOverTime .legendColorBox > div').each(function(i){
            $(this).clone().prependTo(choiceContainer.find("li").eq(i));
        });
    }
};


var responseTimeVsRequestInfos = {
    data: {"result": {"minY": 104.0, "minX": 1.0, "maxY": 42077.0, "series": [{"data": [[8.0, 121.0], [259.0, 2127.0], [1.0, 387.0], [284.0, 274.5], [3.0, 25955.0], [206.0, 3698.5], [56.0, 36305.5], [125.0, 36292.0], [255.0, 104.0]], "isOverall": false, "label": "Successes", "isController": false}, {"data": [[3.0, 42077.0]], "isOverall": false, "label": "Failures", "isController": false}], "supportsControllersDiscrimination": false, "granularity": 1000, "maxX": 284.0, "title": "Response Time Vs Request"}},
    getOptions: function() {
        return {
            series: {
                lines: {
                    show: false
                },
                points: {
                    show: true
                }
            },
            xaxis: {
                axisLabel: "Global number of requests per second",
                axisLabelUseCanvas: true,
                axisLabelFontSizePixels: 12,
                axisLabelFontFamily: 'Verdana, Arial',
                axisLabelPadding: 20,
            },
            yaxis: {
                axisLabel: "Median Response Time in ms",
                axisLabelUseCanvas: true,
                axisLabelFontSizePixels: 12,
                axisLabelFontFamily: 'Verdana, Arial',
                axisLabelPadding: 20,
            },
            legend: {
                noColumns: 2,
                show: true,
                container: '#legendResponseTimeVsRequest'
            },
            selection: {
                mode: 'xy'
            },
            grid: {
                hoverable: true // IMPORTANT! this is needed for tooltip to work
            },
            tooltip: true,
            tooltipOpts: {
                content: "%s : Median response time at %x req/s was %y ms"
            },
            colors: ["#9ACD32", "#FF6347"]
        };
    },
    createGraph: function () {
        var data = this.data;
        var dataset = prepareData(data.result.series, $("#choicesResponseTimeVsRequest"));
        var options = this.getOptions();
        prepareOptions(options, data);
        $.plot($("#flotResponseTimeVsRequest"), dataset, options);
        // setup overview
        $.plot($("#overviewResponseTimeVsRequest"), dataset, prepareOverviewOptions(options));

    }
};

// Response Time vs Request
function refreshResponseTimeVsRequest() {
    var infos = responseTimeVsRequestInfos;
    prepareSeries(infos.data);
    if (isGraph($("#flotResponseTimeVsRequest"))){
        infos.createGraph();
    }else{
        var choiceContainer = $("#choicesResponseTimeVsRequest");
        createLegend(choiceContainer, infos);
        infos.createGraph();
        setGraphZoomable("#flotResponseTimeVsRequest", "#overviewResponseTimeVsRequest");
        $('#footerResponseRimeVsRequest .legendColorBox > div').each(function(i){
            $(this).clone().prependTo(choiceContainer.find("li").eq(i));
        });
    }
};


var latenciesVsRequestInfos = {
    data: {"result": {"minY": 0.0, "minX": 1.0, "maxY": 36305.5, "series": [{"data": [[8.0, 121.0], [259.0, 2117.0], [1.0, 387.0], [284.0, 274.5], [3.0, 25955.0], [206.0, 3696.0], [56.0, 36305.5], [125.0, 36292.0], [255.0, 104.0]], "isOverall": false, "label": "Successes", "isController": false}, {"data": [[3.0, 0.0]], "isOverall": false, "label": "Failures", "isController": false}], "supportsControllersDiscrimination": false, "granularity": 1000, "maxX": 284.0, "title": "Latencies Vs Request"}},
    getOptions: function() {
        return{
            series: {
                lines: {
                    show: false
                },
                points: {
                    show: true
                }
            },
            xaxis: {
                axisLabel: "Global number of requests per second",
                axisLabelUseCanvas: true,
                axisLabelFontSizePixels: 12,
                axisLabelFontFamily: 'Verdana, Arial',
                axisLabelPadding: 20,
            },
            yaxis: {
                axisLabel: "Median Latency in ms",
                axisLabelUseCanvas: true,
                axisLabelFontSizePixels: 12,
                axisLabelFontFamily: 'Verdana, Arial',
                axisLabelPadding: 20,
            },
            legend: { noColumns: 2,show: true, container: '#legendLatencyVsRequest' },
            selection: {
                mode: 'xy'
            },
            grid: {
                hoverable: true // IMPORTANT! this is needed for tooltip to work
            },
            tooltip: true,
            tooltipOpts: {
                content: "%s : Median Latency time at %x req/s was %y ms"
            },
            colors: ["#9ACD32", "#FF6347"]
        };
    },
    createGraph: function () {
        var data = this.data;
        var dataset = prepareData(data.result.series, $("#choicesLatencyVsRequest"));
        var options = this.getOptions();
        prepareOptions(options, data);
        $.plot($("#flotLatenciesVsRequest"), dataset, options);
        // setup overview
        $.plot($("#overviewLatenciesVsRequest"), dataset, prepareOverviewOptions(options));
    }
};

// Latencies vs Request
function refreshLatenciesVsRequest() {
        var infos = latenciesVsRequestInfos;
        prepareSeries(infos.data);
        if(isGraph($("#flotLatenciesVsRequest"))){
            infos.createGraph();
        }else{
            var choiceContainer = $("#choicesLatencyVsRequest");
            createLegend(choiceContainer, infos);
            infos.createGraph();
            setGraphZoomable("#flotLatenciesVsRequest", "#overviewLatenciesVsRequest");
            $('#footerLatenciesVsRequest .legendColorBox > div').each(function(i){
                $(this).clone().prependTo(choiceContainer.find("li").eq(i));
            });
        }
};

var hitsPerSecondInfos = {
        data: {"result": {"minY": 2.8333333333333335, "minX": 1.76395908E12, "maxY": 10.0, "series": [{"data": [[1.7639595E12, 7.166666666666667], [1.76395908E12, 10.0], [1.76395956E12, 2.8333333333333335]], "isOverall": false, "label": "hitsPerSecond", "isController": false}], "supportsControllersDiscrimination": false, "granularity": 60000, "maxX": 1.76395956E12, "title": "Hits Per Second"}},
        getOptions: function() {
            return {
                series: {
                    lines: {
                        show: true
                    },
                    points: {
                        show: true
                    }
                },
                xaxis: {
                    mode: "time",
                    timeformat: getTimeFormat(this.data.result.granularity),
                    axisLabel: getElapsedTimeLabel(this.data.result.granularity),
                    axisLabelUseCanvas: true,
                    axisLabelFontSizePixels: 12,
                    axisLabelFontFamily: 'Verdana, Arial',
                    axisLabelPadding: 20,
                },
                yaxis: {
                    axisLabel: "Number of hits / sec",
                    axisLabelUseCanvas: true,
                    axisLabelFontSizePixels: 12,
                    axisLabelFontFamily: 'Verdana, Arial',
                    axisLabelPadding: 20
                },
                legend: {
                    noColumns: 2,
                    show: true,
                    container: "#legendHitsPerSecond"
                },
                selection: {
                    mode : 'xy'
                },
                grid: {
                    hoverable: true // IMPORTANT! this is needed for tooltip to
                                    // work
                },
                tooltip: true,
                tooltipOpts: {
                    content: "%s at %x was %y.2 hits/sec"
                }
            };
        },
        createGraph: function createGraph() {
            var data = this.data;
            var dataset = prepareData(data.result.series, $("#choicesHitsPerSecond"));
            var options = this.getOptions();
            prepareOptions(options, data);
            $.plot($("#flotHitsPerSecond"), dataset, options);
            // setup overview
            $.plot($("#overviewHitsPerSecond"), dataset, prepareOverviewOptions(options));
        }
};

// Hits per second
function refreshHitsPerSecond(fixTimestamps) {
    var infos = hitsPerSecondInfos;
    prepareSeries(infos.data);
    if(fixTimestamps) {
        fixTimeStamps(infos.data.result.series, 19800000);
    }
    if (isGraph($("#flotHitsPerSecond"))){
        infos.createGraph();
    }else{
        var choiceContainer = $("#choicesHitsPerSecond");
        createLegend(choiceContainer, infos);
        infos.createGraph();
        setGraphZoomable("#flotHitsPerSecond", "#overviewHitsPerSecond");
        $('#footerHitsPerSecond .legendColorBox > div').each(function(i){
            $(this).clone().prependTo(choiceContainer.find("li").eq(i));
        });
    }
}

var codesPerSecondInfos = {
        data: {"result": {"minY": 0.05, "minX": 1.76395908E12, "maxY": 9.9, "series": [{"data": [[1.76395914E12, 0.05], [1.7639595E12, 4.333333333333333], [1.76395908E12, 9.9], [1.76395956E12, 5.666666666666667]], "isOverall": false, "label": "200", "isController": false}, {"data": [[1.76395908E12, 0.05]], "isOverall": false, "label": "Non HTTP response code: org.apache.http.conn.HttpHostConnectException", "isController": false}], "supportsControllersDiscrimination": false, "granularity": 60000, "maxX": 1.76395956E12, "title": "Codes Per Second"}},
        getOptions: function(){
            return {
                series: {
                    lines: {
                        show: true
                    },
                    points: {
                        show: true
                    }
                },
                xaxis: {
                    mode: "time",
                    timeformat: getTimeFormat(this.data.result.granularity),
                    axisLabel: getElapsedTimeLabel(this.data.result.granularity),
                    axisLabelUseCanvas: true,
                    axisLabelFontSizePixels: 12,
                    axisLabelFontFamily: 'Verdana, Arial',
                    axisLabelPadding: 20,
                },
                yaxis: {
                    axisLabel: "Number of responses / sec",
                    axisLabelUseCanvas: true,
                    axisLabelFontSizePixels: 12,
                    axisLabelFontFamily: 'Verdana, Arial',
                    axisLabelPadding: 20,
                },
                legend: {
                    noColumns: 2,
                    show: true,
                    container: "#legendCodesPerSecond"
                },
                selection: {
                    mode: 'xy'
                },
                grid: {
                    hoverable: true // IMPORTANT! this is needed for tooltip to
                                    // work
                },
                tooltip: true,
                tooltipOpts: {
                    content: "Number of Response Codes %s at %x was %y.2 responses / sec"
                }
            };
        },
    createGraph: function() {
        var data = this.data;
        var dataset = prepareData(data.result.series, $("#choicesCodesPerSecond"));
        var options = this.getOptions();
        prepareOptions(options, data);
        $.plot($("#flotCodesPerSecond"), dataset, options);
        // setup overview
        $.plot($("#overviewCodesPerSecond"), dataset, prepareOverviewOptions(options));
    }
};

// Codes per second
function refreshCodesPerSecond(fixTimestamps) {
    var infos = codesPerSecondInfos;
    prepareSeries(infos.data);
    if(fixTimestamps) {
        fixTimeStamps(infos.data.result.series, 19800000);
    }
    if(isGraph($("#flotCodesPerSecond"))){
        infos.createGraph();
    }else{
        var choiceContainer = $("#choicesCodesPerSecond");
        createLegend(choiceContainer, infos);
        infos.createGraph();
        setGraphZoomable("#flotCodesPerSecond", "#overviewCodesPerSecond");
        $('#footerCodesPerSecond .legendColorBox > div').each(function(i){
            $(this).clone().prependTo(choiceContainer.find("li").eq(i));
        });
    }
};

var transactionsPerSecondInfos = {
        data: {"result": {"minY": 0.05, "minX": 1.76395908E12, "maxY": 9.9, "series": [{"data": [[1.76395908E12, 0.05]], "isOverall": false, "label": "HomePage-failure", "isController": false}, {"data": [[1.76395914E12, 0.05], [1.7639595E12, 4.333333333333333], [1.76395908E12, 9.9], [1.76395956E12, 5.666666666666667]], "isOverall": false, "label": "HomePage-success", "isController": false}], "supportsControllersDiscrimination": true, "granularity": 60000, "maxX": 1.76395956E12, "title": "Transactions Per Second"}},
        getOptions: function(){
            return {
                series: {
                    lines: {
                        show: true
                    },
                    points: {
                        show: true
                    }
                },
                xaxis: {
                    mode: "time",
                    timeformat: getTimeFormat(this.data.result.granularity),
                    axisLabel: getElapsedTimeLabel(this.data.result.granularity),
                    axisLabelUseCanvas: true,
                    axisLabelFontSizePixels: 12,
                    axisLabelFontFamily: 'Verdana, Arial',
                    axisLabelPadding: 20,
                },
                yaxis: {
                    axisLabel: "Number of transactions / sec",
                    axisLabelUseCanvas: true,
                    axisLabelFontSizePixels: 12,
                    axisLabelFontFamily: 'Verdana, Arial',
                    axisLabelPadding: 20
                },
                legend: {
                    noColumns: 2,
                    show: true,
                    container: "#legendTransactionsPerSecond"
                },
                selection: {
                    mode: 'xy'
                },
                grid: {
                    hoverable: true // IMPORTANT! this is needed for tooltip to
                                    // work
                },
                tooltip: true,
                tooltipOpts: {
                    content: "%s at %x was %y transactions / sec"
                }
            };
        },
    createGraph: function () {
        var data = this.data;
        var dataset = prepareData(data.result.series, $("#choicesTransactionsPerSecond"));
        var options = this.getOptions();
        prepareOptions(options, data);
        $.plot($("#flotTransactionsPerSecond"), dataset, options);
        // setup overview
        $.plot($("#overviewTransactionsPerSecond"), dataset, prepareOverviewOptions(options));
    }
};

// Transactions per second
function refreshTransactionsPerSecond(fixTimestamps) {
    var infos = transactionsPerSecondInfos;
    prepareSeries(infos.data);
    if(infos.data.result.series.length == 0) {
        setEmptyGraph("#bodyTransactionsPerSecond");
        return;
    }
    if(fixTimestamps) {
        fixTimeStamps(infos.data.result.series, 19800000);
    }
    if(isGraph($("#flotTransactionsPerSecond"))){
        infos.createGraph();
    }else{
        var choiceContainer = $("#choicesTransactionsPerSecond");
        createLegend(choiceContainer, infos);
        infos.createGraph();
        setGraphZoomable("#flotTransactionsPerSecond", "#overviewTransactionsPerSecond");
        $('#footerTransactionsPerSecond .legendColorBox > div').each(function(i){
            $(this).clone().prependTo(choiceContainer.find("li").eq(i));
        });
    }
};

var totalTPSInfos = {
        data: {"result": {"minY": 0.05, "minX": 1.76395908E12, "maxY": 9.9, "series": [{"data": [[1.76395914E12, 0.05], [1.7639595E12, 4.333333333333333], [1.76395908E12, 9.9], [1.76395956E12, 5.666666666666667]], "isOverall": false, "label": "Transaction-success", "isController": false}, {"data": [[1.76395908E12, 0.05]], "isOverall": false, "label": "Transaction-failure", "isController": false}], "supportsControllersDiscrimination": true, "granularity": 60000, "maxX": 1.76395956E12, "title": "Total Transactions Per Second"}},
        getOptions: function(){
            return {
                series: {
                    lines: {
                        show: true
                    },
                    points: {
                        show: true
                    }
                },
                xaxis: {
                    mode: "time",
                    timeformat: getTimeFormat(this.data.result.granularity),
                    axisLabel: getElapsedTimeLabel(this.data.result.granularity),
                    axisLabelUseCanvas: true,
                    axisLabelFontSizePixels: 12,
                    axisLabelFontFamily: 'Verdana, Arial',
                    axisLabelPadding: 20,
                },
                yaxis: {
                    axisLabel: "Number of transactions / sec",
                    axisLabelUseCanvas: true,
                    axisLabelFontSizePixels: 12,
                    axisLabelFontFamily: 'Verdana, Arial',
                    axisLabelPadding: 20
                },
                legend: {
                    noColumns: 2,
                    show: true,
                    container: "#legendTotalTPS"
                },
                selection: {
                    mode: 'xy'
                },
                grid: {
                    hoverable: true // IMPORTANT! this is needed for tooltip to
                                    // work
                },
                tooltip: true,
                tooltipOpts: {
                    content: "%s at %x was %y transactions / sec"
                },
                colors: ["#9ACD32", "#FF6347"]
            };
        },
    createGraph: function () {
        var data = this.data;
        var dataset = prepareData(data.result.series, $("#choicesTotalTPS"));
        var options = this.getOptions();
        prepareOptions(options, data);
        $.plot($("#flotTotalTPS"), dataset, options);
        // setup overview
        $.plot($("#overviewTotalTPS"), dataset, prepareOverviewOptions(options));
    }
};

// Total Transactions per second
function refreshTotalTPS(fixTimestamps) {
    var infos = totalTPSInfos;
    // We want to ignore seriesFilter
    prepareSeries(infos.data, false, true);
    if(fixTimestamps) {
        fixTimeStamps(infos.data.result.series, 19800000);
    }
    if(isGraph($("#flotTotalTPS"))){
        infos.createGraph();
    }else{
        var choiceContainer = $("#choicesTotalTPS");
        createLegend(choiceContainer, infos);
        infos.createGraph();
        setGraphZoomable("#flotTotalTPS", "#overviewTotalTPS");
        $('#footerTotalTPS .legendColorBox > div').each(function(i){
            $(this).clone().prependTo(choiceContainer.find("li").eq(i));
        });
    }
};

// Collapse the graph matching the specified DOM element depending the collapsed
// status
function collapse(elem, collapsed){
    if(collapsed){
        $(elem).parent().find(".fa-chevron-up").removeClass("fa-chevron-up").addClass("fa-chevron-down");
    } else {
        $(elem).parent().find(".fa-chevron-down").removeClass("fa-chevron-down").addClass("fa-chevron-up");
        if (elem.id == "bodyBytesThroughputOverTime") {
            if (isGraph($(elem).find('.flot-chart-content')) == false) {
                refreshBytesThroughputOverTime(true);
            }
            document.location.href="#bytesThroughputOverTime";
        } else if (elem.id == "bodyLatenciesOverTime") {
            if (isGraph($(elem).find('.flot-chart-content')) == false) {
                refreshLatenciesOverTime(true);
            }
            document.location.href="#latenciesOverTime";
        } else if (elem.id == "bodyCustomGraph") {
            if (isGraph($(elem).find('.flot-chart-content')) == false) {
                refreshCustomGraph(true);
            }
            document.location.href="#responseCustomGraph";
        } else if (elem.id == "bodyConnectTimeOverTime") {
            if (isGraph($(elem).find('.flot-chart-content')) == false) {
                refreshConnectTimeOverTime(true);
            }
            document.location.href="#connectTimeOverTime";
        } else if (elem.id == "bodyResponseTimePercentilesOverTime") {
            if (isGraph($(elem).find('.flot-chart-content')) == false) {
                refreshResponseTimePercentilesOverTime(true);
            }
            document.location.href="#responseTimePercentilesOverTime";
        } else if (elem.id == "bodyResponseTimeDistribution") {
            if (isGraph($(elem).find('.flot-chart-content')) == false) {
                refreshResponseTimeDistribution();
            }
            document.location.href="#responseTimeDistribution" ;
        } else if (elem.id == "bodySyntheticResponseTimeDistribution") {
            if (isGraph($(elem).find('.flot-chart-content')) == false) {
                refreshSyntheticResponseTimeDistribution();
            }
            document.location.href="#syntheticResponseTimeDistribution" ;
        } else if (elem.id == "bodyActiveThreadsOverTime") {
            if (isGraph($(elem).find('.flot-chart-content')) == false) {
                refreshActiveThreadsOverTime(true);
            }
            document.location.href="#activeThreadsOverTime";
        } else if (elem.id == "bodyTimeVsThreads") {
            if (isGraph($(elem).find('.flot-chart-content')) == false) {
                refreshTimeVsThreads();
            }
            document.location.href="#timeVsThreads" ;
        } else if (elem.id == "bodyCodesPerSecond") {
            if (isGraph($(elem).find('.flot-chart-content')) == false) {
                refreshCodesPerSecond(true);
            }
            document.location.href="#codesPerSecond";
        } else if (elem.id == "bodyTransactionsPerSecond") {
            if (isGraph($(elem).find('.flot-chart-content')) == false) {
                refreshTransactionsPerSecond(true);
            }
            document.location.href="#transactionsPerSecond";
        } else if (elem.id == "bodyTotalTPS") {
            if (isGraph($(elem).find('.flot-chart-content')) == false) {
                refreshTotalTPS(true);
            }
            document.location.href="#totalTPS";
        } else if (elem.id == "bodyResponseTimeVsRequest") {
            if (isGraph($(elem).find('.flot-chart-content')) == false) {
                refreshResponseTimeVsRequest();
            }
            document.location.href="#responseTimeVsRequest";
        } else if (elem.id == "bodyLatenciesVsRequest") {
            if (isGraph($(elem).find('.flot-chart-content')) == false) {
                refreshLatenciesVsRequest();
            }
            document.location.href="#latencyVsRequest";
        }
    }
}

/*
 * Activates or deactivates all series of the specified graph (represented by id parameter)
 * depending on checked argument.
 */
function toggleAll(id, checked){
    var placeholder = document.getElementById(id);

    var cases = $(placeholder).find(':checkbox');
    cases.prop('checked', checked);
    $(cases).parent().children().children().toggleClass("legend-disabled", !checked);

    var choiceContainer;
    if ( id == "choicesBytesThroughputOverTime"){
        choiceContainer = $("#choicesBytesThroughputOverTime");
        refreshBytesThroughputOverTime(false);
    } else if(id == "choicesResponseTimesOverTime"){
        choiceContainer = $("#choicesResponseTimesOverTime");
        refreshResponseTimeOverTime(false);
    }else if(id == "choicesResponseCustomGraph"){
        choiceContainer = $("#choicesResponseCustomGraph");
        refreshCustomGraph(false);
    } else if ( id == "choicesLatenciesOverTime"){
        choiceContainer = $("#choicesLatenciesOverTime");
        refreshLatenciesOverTime(false);
    } else if ( id == "choicesConnectTimeOverTime"){
        choiceContainer = $("#choicesConnectTimeOverTime");
        refreshConnectTimeOverTime(false);
    } else if ( id == "choicesResponseTimePercentilesOverTime"){
        choiceContainer = $("#choicesResponseTimePercentilesOverTime");
        refreshResponseTimePercentilesOverTime(false);
    } else if ( id == "choicesResponseTimePercentiles"){
        choiceContainer = $("#choicesResponseTimePercentiles");
        refreshResponseTimePercentiles();
    } else if(id == "choicesActiveThreadsOverTime"){
        choiceContainer = $("#choicesActiveThreadsOverTime");
        refreshActiveThreadsOverTime(false);
    } else if ( id == "choicesTimeVsThreads"){
        choiceContainer = $("#choicesTimeVsThreads");
        refreshTimeVsThreads();
    } else if ( id == "choicesSyntheticResponseTimeDistribution"){
        choiceContainer = $("#choicesSyntheticResponseTimeDistribution");
        refreshSyntheticResponseTimeDistribution();
    } else if ( id == "choicesResponseTimeDistribution"){
        choiceContainer = $("#choicesResponseTimeDistribution");
        refreshResponseTimeDistribution();
    } else if ( id == "choicesHitsPerSecond"){
        choiceContainer = $("#choicesHitsPerSecond");
        refreshHitsPerSecond(false);
    } else if(id == "choicesCodesPerSecond"){
        choiceContainer = $("#choicesCodesPerSecond");
        refreshCodesPerSecond(false);
    } else if ( id == "choicesTransactionsPerSecond"){
        choiceContainer = $("#choicesTransactionsPerSecond");
        refreshTransactionsPerSecond(false);
    } else if ( id == "choicesTotalTPS"){
        choiceContainer = $("#choicesTotalTPS");
        refreshTotalTPS(false);
    } else if ( id == "choicesResponseTimeVsRequest"){
        choiceContainer = $("#choicesResponseTimeVsRequest");
        refreshResponseTimeVsRequest();
    } else if ( id == "choicesLatencyVsRequest"){
        choiceContainer = $("#choicesLatencyVsRequest");
        refreshLatenciesVsRequest();
    }
    var color = checked ? "black" : "#818181";
    if(choiceContainer != null) {
        choiceContainer.find("label").each(function(){
            this.style.color = color;
        });
    }
}

