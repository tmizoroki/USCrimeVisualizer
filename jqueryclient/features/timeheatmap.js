var heatit = function() {
  var margin = { top: 50, right: 0, bottom: 100, left: 30 },
    width = 960 - margin.left - margin.right,
    height = 430 - margin.top - margin.bottom,
    gridSize = Math.floor(width / 24),
    legendElementWidth = gridSize*2,
    buckets = 10,
    colors = ["#FFFFFF","#F0FFEB","#D1FFC2","#B2FF99","#94FF70","#75FF47","#5CE62E","#47B224","#33801A","#1F4C0F"], // alternatively colorbrewer.YlGnBu[9]
    days = ["Mon", "Tue", "Wed", "Thu", "Fr", "Sa", "Su"],
    times = ["1a", "2a", "3a", "4a", "5a", "6a", "7a", "8a", "9a", "10a", "11a", "12p", "1p", "2p", "3p", "4p", "5p", "6p", "7p", "8p", "9p", "10p", "11p", "12a"];
    
    var dates = Object.keys(dataStorage);
    
    d3.data(dates,
           function(d) {
            var splitup = d.split(" ");
             return {
               day: Number(splitup[]),
               hour: Number(splitup[]),
               value: +1
             };
           },
           function(error, data) {
           var colorScale = d3.scale.quantile()
             .domain([0, buckets - 1, d3.max(data, function (d) { return d.value; })])
             .range(colors);
             
           var svg = d3.select("#chart").append("svg")
             .attr("width", width + margin.left + margin.right)
             .attr("height", height + margin.top + margin.bottom)
             .append("g")
             .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
             
           var dayLabels = svg.selectAll(".dayLabel")
             .data(days)
             .enter().append("text")
             .text(function (d) { return d; })
             .attr("x", 0)
             .attr("y", function (d, i) { return i * gridSize; })
             .style("text-anchor", "end")
             .attr("transform", "translate(-6," + gridSize / 1.5 + ")")
             .attr("class", function (d, i) { return ((i >= 0 && i <= 4) ? "dayLabel mono axis axis-workweek" : "dayLabel mono axis"); });
             
           var timeLabels = svg.selectAll(".timeLabel")
             .data(times)
             .enter().append("text")
             .text(function(d) { return d; })
             .attr("x", function(d, i) { return i * gridSize; })
             .attr("y", 0)
             .style("text-anchor", "middle")
             .attr("transform", "translate(" + gridSize / 2 + ", -6)")
             .attr("class", function(d, i) { return ((i >= 7 && i <= 16) ? "timeLabel mono axis axis-worktime" : "timeLabel mono axis"); });
           
           var heatMap = svg.selectAll(".hour")
             .data(data)
             .enter().append("rect")
             .attr("x", function(d) { return (d.hour - 1) * gridSize; })
             .attr("y", function(d) { return (d.day - 1) * gridSize; })
             .attr("rx", 4)
             .attr("ry", 4)
             .attr("class", "hour bordered")
             .attr("width", gridSize)
             .attr("height", gridSize)
             .style("fill", colors[0]);
           
           heatMap.transition().duration(1000)
            .style("fill", function(d) { return colors[d.value] ; });
           
           heatMap.append("title").text(function(d) { return d.value; });
           
           var legend = svg.selectAll(".legend")
             .data([0].concat(colorScale.quantiles()), function(d) { return d; })
             .enter().append("g")
             .attr("class", "legend");
           
           legend.append("rect")
             .attr("x", function(d, i) { return legendElementWidth * i; })
             .attr("y", height)
             .attr("width", legendElementWidth)
             .attr("height", gridSize / 2)
             .style("fill", function(d, i) { return colors[i+1]; });
           
           legend.append("text")
             .attr("class", "mono")
             .text(function(d, i) { return "= " + (i + 1); })
             .attr("x", function(d, i) { return legendElementWidth * i; })
             .attr("y", height + gridSize);
             });}
}
