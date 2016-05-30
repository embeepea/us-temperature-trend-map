# Temperature Trend Map

![Temperature Trend Map](map1-2.png)

## Overview

This an interctive map that lets you explore
long term daily temperature data from the
[Global Historical Climatology Network](https://www.ncdc.noaa.gov/data-access/land-based-station-data/land-based-datasets/global-historical-climatology-network-ghcn).

You can view it online here: http://demos.fernleafinteractive.com/temperature-trends

And here's a short video screencast demo: https://www.youtube.com/watch?v=b1NsRnbRwD0

## Usage Instructions

The map shows just over 2000 weather stations in the United States, colored
according to how the annual average temperature changed at that station over the 20th century.
A red color indicates an increase, and a blue color indicates a decrease, with the
intensity of the color indicating the amount of change.

As you move the mouse over the stations in the map, the large black
inset graph in the upper right corner shows the annual data from each
station.

Clicking on a station will "lock" the display onto that station; clicking
on any station thereafter will unlock it.

In the large black inset graph, the red plot shows the annual average
of the daily maximum temperature, and the cyan plot shows the annual
average of the daily minimum temperature.  The white plot is the
average of these two.  Each of these three plots show the actual annual
timeseries, as well as the trend line associate with it.

The smaller black inside window shows the trend lines, with their
slopes magnified by a factor of 10, just so that you can better see
the direction of the slope.

![Daily Data Plot](inset-2.png)

You can click on the little pop-out icon in the upper left corner of the
large black inset graph to get a detailed graph of the individual daily values
for that station.

![Daily Data Plot](map2-2.png)

The graph is interactive -- you can pan the graph with the mouse, and/or
use the mouse scroll wheel to zoom in or out.  You can also zoom by holding
down the keyboard shift key while dragging with the mouse.

## Setup

## Data Analysis

I made this as a demonstration of one way to visualize climate data; it's intended simply
as a demonstration of the software involved, not as a definitive statement about trends
in climate data.

Here's what went into it:

1. I downloaded all the daily station data from the web site above.  The
   entire data set contains data from roughly 90,000 stations.
   
2. I eliminated all data except for TMIN and TMAX, the daily temperature
   minimum and maximum values.  The whole analysis here involves only
   those two parameters.
   
3. I eliminated all stations that did not have TMIN and TMAX data for at least 90% of
   all days in the period 1950-2010.  That left 2094 stations.
   
4. For each of those 2094 stations, for each year starting with 1900
   for which the station had TMIN/TMAX data, I computed the average TMIN
   and TMAX values for the year.  I did not do this, however, for any years
   in which there was a stretch of more than 7 days of missing TMIN or TMAX
   data.  This produces two time-series of annual data for each station,
   one each for TMIN and TMAX.

5. For each of the above annual average TMIN/TMAX time series, I computed
   a linear least-squares best-fit line for the series.
   
The code that performed the above analysis is written in Clojure and
is available here: 
[http://github.com/embeepea/ghcn-trend-analysis](http://github.com/embeepea/ghcn-trend-analysis).

