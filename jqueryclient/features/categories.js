var makeCategories = function (data) {
  var categories = [];
  // keep data in same order
  data.sort(function(a,b) {
    if (a._id.Category > b._id.Category) {
      return 1
    } else {
      return -1;
    }
  });
  data.forEach(function (d) {
    // make categories array with category name and number of crimes
    categories.push([d._id.Category, d.count]);
  });
  // before appending categories we empty out the div 
  $(".categories").empty();

  // make buttons for every crime category
  _.each(categories, function (value) {
    $(".categories").append("<dd class=\"category\">" + value[0] + " " + value[1] + "</dd>");
  });
  // select svg from html
  //var svg = d3.select("#mapcomp");
  // on hover display only those crimes within that category
  $(".category").click(function () {
    // change selected category
    d3.selectAll('.category.selectedCat')
      .classed('selectedCat', false);

    d3.select(this).classed('selectedCat', true);

    var svg = d3.select("#mapcomp");

    var category = $(this).text().split(" ")[0];

    svg.select("#datapoints").selectAll("circle").remove();
    var svg = svg.select("#datapoints");
    var filtered = [];
    for(var i = 0; i < monthData.length; i++){
      if(monthData[i].Category.split(" ")[0] === category){
        filtered.push(monthData[i]);
      }
    }

    svg.selectAll("circle")
          .data(filtered).enter()
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
          .attr("r", size())
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
  });
};