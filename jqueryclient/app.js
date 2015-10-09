// dataStorage will hold the data for a month's worth of events
// each key will be a date time group (e.g. Wed 09/03/2015, 03:05)
// the value for a key will be an array with all crime events
// this allows for the clock's tick function to have fast lookup of events
// that match to the current time on the clock
var dataStorage = {};

// the variable now is the current data-time-group
// which shows where the clock is currently at
var projection, now;

// Zoom behavior of map
var zoom = d3.behavior.zoom().scaleExtent([1, 8]).on("zoom", zoomed);

var size = function() {
  return 4/zoom.scale() + 'px';
}

// Tool tip
var tooltip = d3.select("body").append("div") 
      .attr("class", "tooltip")       
      .style("opacity", 0);

// Zoom function
function zoomed () {
  var recomputedSize = size();
  var g = d3.select("#mapcomp").selectAll("g");
  g.selectAll("circle").attr("r", function(d){
    if(d3.select(this).attr("r") !== '0px'){
      return recomputedSize;
    } else {
      return '0px';
    }
  });
  g.attr("transform","translate(" + zoom.translate() + ")" + "scale(" + zoom.scale() + ")")
}

// we have a default playback speed for showing events
// but it can be changed
var playbackSpeed = 300;
var order = 1;
var initial;

// another global variable play is set to false initially
// when true, the animation will play
var play = false;

// monthData will hold the entire data after a month's worth of data
// is fetched
var monthData;


var sliderTime = {hour: 0, minute: 0};
var sliderMoved = false;
// var dateChanged = false;

// converts value in range slider to hours and minutes.
var minToHHMM = function(min) {
  var hour = Math.floor( min / 60);
  var minute = min % 60;
  return {hour: hour, minute: minute}
};

var hhmmToMin = function(hour, minute) {
  return (hour * 60) + minute;
}

$('#time').on('input', function() {
  sliderTime =  minToHHMM(parseInt(this.value));
  modifyClock(sliderTime.hour, sliderTime.minute);
  sliderMoved = true;
});
 
var storeData = function (data) {
  dataStorage = {}; // clear out old data storage when this function is run
  for (var i = 0; i < data.length; i++) {
    var dtg = new Date(data[i].Date + ',' + data[i].Time);
    if (dataStorage[dtg]) {
      dataStorage[dtg].push(data[i]);
    } else { // in case there are multiple events at the same time, we will store them in an array
      dataStorage[dtg] = [data[i]];
    }
  }
  monthData = data;
  // return data;
}

var getData = function (callback, params) {
  /* Makes ajax call to database with 
     the needed params. eg the start date from where to fetch crimes
  */
  $.get('/api/events/' + params , function (data) {
    callback(data);
  });
};

// renderPoints takes a callback to ensure that it isn't event blocking
var renderPoints = function (data, callback) {
  // renders points of crime on the map created by render() function call 
  // this function gets called by an event in timeline.js
  // depending on what timeperiod the user requested, this function will get called
  // with different params 
  var coord;
  // add circles to svg
  var svg = d3.select("#datapoints");
  // tooltip element is invisible by default
  
      
  // add dots to svg
  // this is where the magic happens 
  // 'glues' the dots to the map
  // d3 is smart enough to know where to put the dots based on lat and longitude
  var recomputedSize = size();
  svg.selectAll("circle")
    .remove()
    .data(data).enter()
    .append("circle")
    .attr("cx", function (d) {
      coord = [d.X, d.Y];
      return projection(coord)[0]; 
    })
    .attr("cy", function (d) { 
      coord = [d.X, d.Y];
      return projection(coord)[1]; 
    })
    .style("fill", function(d){return category_color(d.Category);})
    .attr("r", recomputedSize)
    .style("stroke-width", 0)
    .on("mouseover", function(d) {
        // render tooltip when hovering over a crime 
        tooltip.transition()    
           .duration(200)    
           .style("opacity", .9);    
        tooltip.html("<p>"+d.Category+"</p>" + "<p>"+ d.Address+"</p>")

          .style("left", (d3.event.pageX) + "px")   
          .style("top", (d3.event.pageY - 28) + "px");
        })          
    .on("mouseout", function(d) {   
        // make tooltip invisible when user stops hovering over dot  
        tooltip.transition()    
            .duration(500)    
            .style("opacity", 0);
    })
    if (callback) {
      callback();
    }
};

// this function is currently not used
var animatePoints = function(svg) {
  // set all the crime dots to invisible
  svg.selectAll("circle")
  // they will take 500 ms to appear
  .transition(500)
  // but this will be delayed by the hour and minute of the crime in the database 
  .delay(function(d) {
    var time = d.Time.split(":");
    return (time[0] * 1000) + ((time[1] / 60) * 1000);
  })
  // make it look nice
  .ease("cubic-in-out")
  .attr("r", "2px")
  // make it fade out again
  .transition()
  // every dot will be visible for 1000 ms, hence the last number in the delay function
  .delay(function(d) {
    var time = d.Time.split(":");
    return ((time[0] * 1000) + ((time[1] / 60) * 1000) + 1000);
  })
  .ease("cubic-in-out")
  .attr("r", "0px");
};

var render = function () {
  // Renders the map (districts outline) into the city div. 
  var width = .7 * window.innerWidth;
  var height = .9 * window.innerHeight;
  
  // hide the ajax spinner until data is being loaded
  d3.select('.spinner').style('visibility', 'hidden');

  // Creates the map svg
  var svg = d3.select('#map').append("svg").attr('id',"mapcomp")
  .attr("width", "70%").attr("height", "70%")
  .attr('viewBox', "0 0 " + width + " " + height + "")
    .call(zoom);
 

  // Map of San Francisco
  projection = d3.geo.mercator().scale(1).translate([0, 0]).precision(0);
  var path = d3.geo.path().projection(projection);
  // gsfmap is a global variable from map/map.js
  var bounds = path.bounds(gsfmap);


  xScale = width / Math.abs(bounds[1][0] - bounds[0][0]);
  yScale = height / Math.abs(bounds[1][1] - bounds[0][1]);  
  scale = xScale < yScale ? xScale : yScale;


  var transl = [(width - scale * (bounds[1][0] + bounds[0][0])) / 2, (height - scale * (bounds[1][1] + bounds[0][1])) / 2];
  // transl[0] -= 350;
  // transl[1] -= 100;
  // var transl = [695371.1539372412, 232135.6735346407];
  projection.scale(scale).translate(transl);
  // shows district information on top of map when hovering over it
  svg.append("g")
      .attr("id","grouped")
      .selectAll("path").data(gsfmap.features).enter().append("path").attr("d", path).attr('data-id', function(d) {
    return d.id;
  }).attr('data-name', function(d) {
    return d.properties.name;
  });

  d3.select("#mapcomp").append("g")
    .attr("id","datapoints");




  // displays the district name that you're hovering on on the map 
  $('svg path').hover(function() {
    $("#district").text($(this).data("name"));
  });

  function interpolateZoom (translate, scale) {
      return d3.transition().duration(350).tween("zoom", function () {
          var iTranslate = d3.interpolate(zoom.translate(), translate),
              iScale = d3.interpolate(zoom.scale(), scale);
          return function (t) {
              zoom
                  .scale(iScale(t))
                  .translate(iTranslate(t));
              zoomed();
          };
      });
  }

  function zoomClick () {
      var clicked = d3.event.target,
          direction = 1,
          factor = 0.2,
          target_zoom = 1,
          center = [width / 2, height / 2],
          extent = zoom.scaleExtent(),
          translate = zoom.translate(),
          translate0 = [],
          l = [],
          view = {x: translate[0], y: translate[1], k: zoom.scale()};

      d3.event.preventDefault();
      direction = (this.id === 'zoom_in') ? 1 : -1;
      target_zoom = zoom.scale() * (1 + factor * direction);

      if (target_zoom < extent[0] || target_zoom > extent[1]) { return false; }

      translate0 = [(center[0] - view.x) / view.k, (center[1] - view.y) / view.k];
      view.k = target_zoom;
      l = [translate0[0] * view.k + view.x, translate0[1] * view.k + view.y];

      view.x += center[0] - l[0];
      view.y += center[1] - l[1];

      interpolateZoom([view.x, view.y], view.k);
  }

  // set up listener for clicking on zoom buttons
  d3.selectAll(".zoom").on('click', zoomClick);
  // renderPoints(svg, projection);
};

// Set up clock on the screen
var svgOverlay = d3.select("#clockBoard");
var svg = d3.selectAll("#clock");


svgOverlay.attr("id", "overlay");

var digit = svg.selectAll(".digit");
var separator = svg.selectAll(".separator circle");

var digitPattern = [
  [1,0,1,1,0,1,1,1,1,1],
  [1,0,0,0,1,1,1,0,1,1],
  [1,1,1,1,1,0,0,1,1,1],
  [0,0,1,1,1,1,1,0,1,1],
  [1,0,1,0,0,0,1,0,1,0],
  [1,1,0,1,1,1,1,1,1,1],
  [1,0,1,1,0,1,1,0,1,1]
];

var category_color = function(category){
  var colors = {};
  category = category.toLowerCase();
  colors['person'] = '#FF0000';
  colors['society'] = '#00FF00';
  colors['property'] = '#0000FF';
  switch(category){
    case 'assault':
      return colors['person'];
      break;
    case 'kidnapping':
      return colors['person'];
      break;
    case 'sex offenses, forcible':
      return colors['person'];
      break;
    case 'sex offenses, nonforcible':
      return colors['person'];
      break;
    case 'disorderly conduct':
      return colors['society'];
      break;
    case 'driving under the influence':
      return colors['society'];
      break;
    case 'drug/narcotic':
      return colors['society'];
      break;
    case 'drunkness':
      return colors['society'];
      break;
    case 'family offenses':
      return colors['society'];
      break;
    case 'liquor laws':
      return colors['society'];
      break;
    case 'loitering':
      return colors['society'];
      break;
    case 'prostitution':
      return colors['society'];
      break;
    case 'trespass':
      return colors['society'];
      break;
    case 'weapon laws':
      return colors['society'];
      break;
    case 'arson':
      return colors['property'];
      break;
    case 'bad checks':
      return colors['property'];
      break;
    case 'bribery':
      return colors['property'];
      break;
    case 'burglary':
      return colors['property'];
      break;
    case 'embezzlement':
      return colors['property'];
      break;
    case 'forgery/counterfeiting':
      return colors['property'];
      break;
    case 'fraud':
      return colors['property'];
      break;
    case 'larceny/theft':
      return colors['property'];
      break;
    case 'robbery':
      return colors['property'];
      break;
    case 'stolen property':
      return colors['property'];
      break;
    case 'vandalism':
      return colors['property'];
      break;
    case 'vehicle theft':
      return colors['property'];
      break;
    default:
      return '#808080'
      break;
  }
}

function modifyClock (hours, minutes, seconds) {
  // modifies the look of the clock as it increases
  digit = digit.data([hours / 10 | 0, hours % 10, minutes / 10 | 0, minutes % 10, seconds / 10 | 0, seconds % 10]);
  digit.select("path:nth-child(1)").classed("lit", function(d) { return digitPattern[0][d]; });
  digit.select("path:nth-child(2)").classed("lit", function(d) { return digitPattern[1][d]; });
  digit.select("path:nth-child(3)").classed("lit", function(d) { return digitPattern[2][d]; });
  digit.select("path:nth-child(4)").classed("lit", function(d) { return digitPattern[3][d]; });
  digit.select("path:nth-child(5)").classed("lit", function(d) { return digitPattern[4][d]; });
  digit.select("path:nth-child(6)").classed("lit", function(d) { return digitPattern[5][d]; });
  digit.select("path:nth-child(7)").classed("lit", function(d) { return digitPattern[6][d]; });
  separator.classed("lit", minutes);
}

function modifySlider (hour, minute) {
  var min = hhmmToMin(hour, minute);
  $('#time').val(min);
}

$('.datepicker').pickadate({
    selectMonths: true, // Creates a dropdown to control month
    selectYears: 15 // Creates a dropdown of 15 years to control year
});

var $input = $('.datepicker').pickadate()

// Use the picker object directly.
var picker = $input.pickadate('picker')


function setDate(date) {
  picker.set('select', date);
}

function tick (dtg) {
  now = new Date(dtg);

  if (now.getMinutes() === 0 && now.getHours() === 0) {
    setDate(now);
  }

  // Grab the date from the calendar and store it in "date"
  var date = picker.get('select');

  now.setFullYear(date.year, date.month, date.date)

  if (sliderMoved) {
    now.setHours(sliderTime.hour, sliderTime.minute);
    sliderMoved = false;
  }

  var year = now.getFullYear();
  var month = now.getMonth();
  hours = now.getHours();
  minutes = now.getMinutes();
  seconds = now.getSeconds();

  // Change the clock's display to the current time
  modifyClock(hours, minutes, seconds);

  // Change the slider's position based on the current time.
  modifySlider(hours, minutes);

  // Set the current month's boundries, 00:00 of the first day to 23:59 of the last day
  var firstDay = new Date(year, month);
  var lastDay = new Date(year, month + 1, 0, 23, 59);

  // check if play is pressed
  if (play) {

    if(now > firstDay && now < lastDay) {
      //if there is data for that specific minute
      if (dataStorage[now]) {
        renderPoints(dataStorage[now], function () {
          setTimeout(function() {
            tick(now.getTime() + (60000 * order)) // adding 60000 ms increases clock time by one minute

          }, playbackSpeed); // animate the clock at speed of playbackSpeed
        });

      } else {
        setTimeout(function() {
          tick(now.getTime() + (60000 * order))
        }, playbackSpeed);
      }
    } else {
      $("#play").toggle();
      $("#pause").toggle();
      play = !play;
      order = order * -1;
    }
  }
}
$("#playbackSlider").on("input", function() {
  //min 1000 max 1600 default 1300
  if (this.value > 800) {
    playbackSpeed = 800 - (this.value - 800);
  } else {
    playbackSpeed = 800 + (800 - this.value);
  }
  
});
// listener for increasing playback speed
$("#forward").on("click", function () {
  order = 1;
});

$("#reverse").on("click", function () {
  order = -1;
})

// play button will also have an on click event
// the callback should set play to the opposite of what it was and relaunch tick function
d3.selectAll("#play, #pause").on("click", function () {
  // switch from showing play or pause button
  $("#play").toggle();
  $("#pause").toggle(); // pause is initially set to display: none in the css
  // if play is false, pressing play will set it to true, and vice versa
  play = !play;
  // call the tick function to turn on the clock
  //add a minute to start to prevent rewinding into previous month
  now = new Date(now.getTime() + 60000);
  tick(now);
});

// render the map on screen when the app loads
render();
