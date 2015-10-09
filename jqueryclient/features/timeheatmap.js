var heatit = function() {
  //{ top: 50, right: 0, bottom: 100, left: 30 }
  var margin = { top: 100, right: 100, bottom: 100, left: 100 },
    width = 960 - margin.left - margin.right,
    height = 430 - margin.top - margin.bottom,
    gridSize = Math.floor(width / 24),
    legendElementWidth = gridSize*2,
    buckets = 10,
    colors = ["#C1EAF7","#A3DFF3","#84D5EF","#74CFED","#5BB6D4","#478DA4","#326576","#28515E","#14282F","#000000"], // alternatively colorbrewer.YlGnBu[9]
    days = ["Mon", "Tue", "Wed", "Thu", "Fr", "Sa", "Su"],
    times = ["1a", "2a", "3a", "4a", "5a", "6a", "7a", "8a", "9a", "10a", "11a", "12p", "1p", "2p", "3p", "4p", "5p", "6p", "7p", "8p", "9p", "10p", "11p", "12a"],
    numeralWeek = {"Mon": 1,"Tue":2,"Wed":3,"Thu":4,"Fri":5,"Sat":6,"Sun":7};
    
    var reference = {};
    var dates = Object.keys(dataStorage);

    for(var i = 0; i < dates.length; i++){
      var newKey = dates[i].split(" ");
      var time = newKey[4].split(":")[0];
      var ref = newKey[0] + "," + time;
      if(!reference[ref]){
        reference[ref] = 1;
      } else {
        reference[ref] += 1;
      }
    }

    dates = [];

    for(var key in reference){
      var splitup = key.split(",");
      var obj = {
        day: numeralWeek[splitup[0]],
        hour: Number(splitup[1]),
        value: reference[key]
      }
      dates.push(obj);
    }

    var data = dates;

    var colorScale = d3.scale.quantile()
     .domain([0, buckets - 1, d3.max(dates, function (d) { return d.value; })])
     .range(colors);

    var classify = function(value){
      var ans = 0;
      for(var i = 0; i < colorScale.quantiles().length; i++){
        if(value > colorScale.quantiles()[i]){
          ans = i;
        }
      }
      return ans;
    }

    d3.select("#chart").select("svg").remove();
     
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
      .style("fill", function(d) { return colors[classify(d.value)] ; });

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

} 

