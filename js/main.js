// load google charts timeline package
google.charts.load("current", {packages: ["timeline"]});

// initiate globals
let languageDataLabel = [];
let languageData = [];
let jobData = [];
let colorCounter = [];
let file = '';

// upload file
function handleFileSelect(e) {
  file = e.target.files[0]; // FileList object
  let reader = new FileReader();
  reader.onload = function() {
    file = (reader.result);
    drawVis();
  };
  // Read the file as a data URL.
  reader.readAsDataURL(file);
}

// listen for file changes
document.getElementById('files').addEventListener('change', handleFileSelect, false);

// read xml data from uploaded file
// draw visualizations
function drawVis() {
  const xhr = new XMLHttpRequest();
  xhr.onreadystatechange = function() {
    if (this.readyState === 4 && this.status === 200) {
      const doc = xhr.responseXML;
      const cv = getJXONTree(doc);

      // change UI
      changeUI();

      // read data for timeline
      readWorkexperience(cv);
      readEducation(cv);

      // draw timeline
      google.charts.setOnLoadCallback(drawTimeline);

      // read data for roseCharts
      readLanguages(cv);

      // draw roseCharts
      drawRoseChart();

      // read data for starRatings and draw them
      readDCDrawStarRatings(cv);

      // convert charts to images
      createImages();
    }
  };
  xhr.open("GET", file, true);
  xhr.send();
}

// set all charts to visible
// hide info + input button
// add back button
function changeUI() {
  //set roseCharts to visible
  document.getElementById('roseCharts').classList.remove('hidden');

  // set timeline to visible
  document.getElementById('timelineContainer').classList.remove('hidden');
  document.getElementById('timeline').style.minHeight = '500px';

  //set starRating to visible
  document.getElementById('starRating').classList.remove('hidden');

  // hide info + input button
  document.getElementById('info').style.display = 'none';

  // show back button + add functionality
  let back = document.getElementById('back');
  back.style.visibility = 'visible';
  back.addEventListener('click', function() { location.reload(); });
  back.style.cursor = 'pointer';
}

// chart.js rose chart
function drawRoseChart() {
  window.chartColors = {
    color1: '#f0f9e8',
    color2: '#bae4bc',
    color3: '#7bccc4',
    color4: '#43a2ca',
    color5: '#0868ac',
  };
  const chartColors = window.chartColors;
  const color = Chart.helpers.color;
  Chart.defaults.global.defaultFontColor = '#444';
  Chart.defaults.global.defaultFontFamily = "'Work Sans', 'Helvetica Neue', 'Helvetica', 'Arial', sans-serif";
  Chart.defaults.global.defaultFontSize = 14;
  Chart.defaults.global.defaultColor = '#fff';

  const config = [];
  for(let i=0; i<languageDataLabel.length;i++){

    let myData = [];
    for (const value in languageData[i]) {
      switch(languageData[i][value]) {
        case "A1":
          myData.push(1);
          break;
        case "A2":
          myData.push(2);
          break;
        case "B1":
          myData.push(3);
          break;
        case "B2":
          myData.push(4);
          break;
        case "C1":
          myData.push(5);
          break;
        case "C2":
          myData.push(6);
          break;
      }
    }

    config[i] = {
      data: {
        datasets: [{
          data: myData,
          backgroundColor: [
            color(chartColors.color1).alpha(0.6).rgbString(),
            color(chartColors.color2).alpha(0.8).rgbString(),
            color(chartColors.color3).alpha(0.8).rgbString(),
            color(chartColors.color4).alpha(0.8).rgbString(),
            color(chartColors.color5).alpha(0.8).rgbString(),
          ],
        }],
        labels: [
          "Hören",
          "Lesen",
          "An Gesprächen teilnehmen",
          "Zusammenhängendes Sprechen",
          "Schreiben"
        ]
      },
      options: {
        responsive: true,
        legend: {
          position: 'left',
        },
        title: {
          display: true,
          text: languageDataLabel[i]
        },
        tooltips: {
          enabled: false
        },
        //change start angle for better legibility
        startAngle: 1.3 * Math.PI,
        scale: {
        ticks: {
          beginAtZero: false,
          min: 0,
          max: 6,
          maxTicksLimit: 6,
          suggestedMin: 6,
          suggestedMax: 6,
          stepSize: 1,
          //change labeling
          callback: function(label) {
            switch (label) {
              case 1:
                return 'A1';
              case 2:
                return 'A2';
              case 3:
                return 'B1';
              case 4:
                return 'B2';
              case 5:
                return 'C1';
              case 6:
                return 'C2';
            }
          }
        },
          reverse: false
        },
        animation: {
          animateRotate: true,
          animateScale: true
        }
      }
    };

    document.getElementById('roseChartGrid').insertAdjacentHTML('beforeend', '<canvas id="roseChart' + i + '" class="roseChart"></canvas>');
  }
  //draw charts
  let first = true;
  const charts = [];

  for(let i=0; i<languageDataLabel.length;i++){
    if(!first) {
      Chart.defaults.global.legend.display=false;
    }
    charts[i] = document.getElementById("roseChart"+i);

    // set background to white, even when chart will be exported to image
    Chart.plugins.register({
      beforeDraw: function(chartInstance) {
        charts[i] = chartInstance.chart.ctx;
        charts[i].fillStyle = "white";
        charts[i].fillRect(0, 0, chartInstance.chart.width, chartInstance.chart.height);
      }
    });
    window.myPolarArea = Chart.PolarArea(charts[i], config[i]);
    first = false;
  }
}

// google charts timeline
function drawTimeline() {
  const container = document.getElementById('timeline');
  const chart = new google.visualization.Timeline(container);
  const dataTable = new google.visualization.DataTable();
  dataTable.addColumn({type: 'string', id: 'Position'});
  dataTable.addColumn({type: 'string', id: 'Name'});
  dataTable.addColumn({type: 'date', id: 'Start'});
  dataTable.addColumn({type: 'date', id: 'End'});
  dataTable.addRows(jobData);

  //define colors for each group of data
  const color1 = '#deebf7';
  const color2 = '#9ecae1';
  let colors = [];

  //add colors for jobs
  for (let i = 0; i < colorCounter['jobs']; i++){
    colors.push(color1);
  }

  //add colors for education
  for (let i = 0; i < colorCounter['education']; i++){
    colors.push(color2);
  }

  const options = {
    timeline: {
      groupByRowLabel: false,
      colorByRowLabel: false,
      showRowLabels: true,
      rowLabelStyle: {
        fontName: "'Work Sans', 'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
        color: '#444',
        fontSize: 14
      },
      barLabelStyle: {
        fontName: "'Work Sans', 'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
        color: '#444',
        fontSize: 14
      }
    },
    colors: colors,
  };

  // draw timeline
  chart.draw(dataTable, options);
}

// read digital competences
// draw starRatings with fontawesome
function readDCDrawStarRatings(cv) {
  const digital = cv.skillspassport.learnerinfo.skills.computer.proficiencylevel;

  let oneStar = '<i class="fa fa-star" aria-hidden="true"></i><i class="fa fa-star-o" aria-hidden="true"></i><i class="fa fa-star-o" aria-hidden="true"></i>';
  let twoStar = '<i class="fa fa-star" aria-hidden="true"></i><i class="fa fa-star" aria-hidden="true"></i><i class="fa fa-star-o" aria-hidden="true"></i>';
  let threeStar = '<i class="fa fa-star" aria-hidden="true"></i><i class="fa fa-star" aria-hidden="true"></i><i class="fa fa-star" aria-hidden="true"></i>';
  let el;
  let p;

  el = document.getElementById('information');
  p = '<p>Datenverarbeitung</p>';
  if(digital.information === 'A'){
    el.innerHTML = p + oneStar;
  } else if (digital.information === 'B') {
    el.innerHTML = p + twoStar;
  } else if (digital.information === 'C') {
    el.innerHTML = p + threeStar;
  }

  el = document.getElementById('communication');
  p = '<p>Kommunikation</p>';
  if(digital.communication === 'A'){
    el.innerHTML = p + oneStar;
  } else if (digital.communication === 'B') {
    el.innerHTML = p + twoStar;
  } else if (digital.communication === 'C') {
    el.innerHTML = p + threeStar;
  }

  el = document.getElementById('contentcreation');
  p = '<p>Erstellung von Inhalten</p>';
  if(digital.contentcreation === 'A'){
    el.innerHTML = p + oneStar;
  } else if (digital.contentcreation === 'B') {
    elinnerHTML = p + twoStar;
  } else if (digital.contentcreation === 'C') {
    el.innerHTML = p + threeStar;
  }

  el = document.getElementById('safety');
  p = '<p>Sicherheit</p>';
  if(digital.safety === 'A'){
    el.innerHTML = p + oneStar;
  } else if (digital.safety === 'B') {
    el.innerHTML = p + twoStar;
  } else if (digital.safety === 'C') {
    el.innerHTML = p + threeStar;
  }

  el = document.getElementById('problemsolving');
  p = '<p>Problemlösung</p>';
  if(digital.problemsolving === 'A'){
    el.innerHTML = p + oneStar;
  } else if (digital.problemsolving === 'B') {
    el.innerHTML = p + twoStar;
  } else if (digital.problemsolving === 'C') {
    el.innerHTML = p + threeStar;
  }
}

// read workexperience
//TODO: resolve code duplication of date generation
function readWorkexperience (cv) {
  const jobs = cv.skillspassport.learnerinfo.workexperiencelist.workexperience;
  colorCounter['jobs'] = jobs.length;
  for (let i = 0; i < jobs.length; i++) {
    let fromYear = (jobs[i].period.from["@year"]);
    let fromMonth = jobs[i].period.from["@month"];
    fromMonth = jobs[i].period.from["@month"].toString();
    if (fromMonth.length<=4){
      fromMonth = fromMonth.slice(2)
    }
    else{
      fromMonth = fromMonth.split(" ");
      fromMonth = (fromMonth[1]);
      fromMonth = lookupMonth(fromMonth);
    }
    let fromDate = new Date(fromYear, fromMonth);

    let toDate = new Date();
    if (jobs[i].period.to !== undefined){
      let toYear = (jobs[i].period.to["@year"]);
      let toMonth = jobs[i].period.to["@month"].toString();
      if (toMonth.length<=4){
        toMonth = toMonth.slice(2)
      }
      else{
        toMonth = toMonth.split(" ");
        toMonth = (toMonth[1]);
        toMonth = lookupMonth(toMonth);
      }
      toDate = new Date(toYear, toMonth);
    }
    jobData[i] = [];
    let label = 'Berufserfahrung';
    if (i !== 0){
      label = '.';
    }
    jobData[i].push(label, jobs[i].position.label + ', ' + jobs[i].employer.name.toString(), fromDate, toDate);
  }
}

// change Month from string to number
function lookupMonth (month) {
  let m;
  m =
    month === 'Jan' ? 1 :
      month === 'Feb' ? 2 :
        month === 'Mar' ? 3 :
          month === 'Apr' ? 4 :
            month === 'May' ? 5 :
              month === 'Jun' ? 6 :
                month === 'Jul' ? 7 :
                  month === 'Aug' ? 8 :
                    month === 'Sep' ? 9 :
                      month === 'Oct' ? 10 :
                        month === 'Nov'? 11 :
                          month === 'Dec' ? 12 :
                            '';
  return m;
}

// read education
function readEducation (cv) {
  const education = cv.skillspassport.learnerinfo.educationlist.education;
  const amountJobs = colorCounter['jobs'];
  colorCounter['education'] = education.length;
  for (let i = 0; i < education.length; i++) {
    let fromYear = (education[i].period.from["@year"]);
    let fromMonth = education[i].period.from["@month"].toString();

    if (fromMonth.length<=4){
      fromMonth = fromMonth.slice(2)
    }
    else{
      fromMonth = fromMonth.split(" ");
      fromMonth = (fromMonth[1]);
      fromMonth = lookupMonth(fromMonth);
    }
    let fromDate = new Date(fromYear, fromMonth);

    let toDate = new Date();
    if (education[i].period.to !== undefined){
      let toYear = (education[i].period.to["@year"]);
      let toMonth = education[i].period.to["@month"].toString();
      if (toMonth.length<=4){
        toMonth = toMonth.slice(2)
      }
      else{
        toMonth = toMonth.split(" ");
        toMonth = (toMonth[1]);
        toMonth = lookupMonth(toMonth);
      }
      toDate = new Date(toYear, toMonth);
    }

    jobData[i+amountJobs] = [];
    let label = 'Schul- und Berufssbildung';
    if (i !== 0){
      label = '.';
    }
    jobData[i+amountJobs].push(label, education[i].title + ', ' + education[i].organisation.name.toString(), fromDate, toDate);
  }
}

// read languages
function readLanguages (cv) {
  const languages = cv.skillspassport.learnerinfo.skills.linguistic.foreignlanguagelist.foreignlanguage;
  for (let i = 0; i < languages.length; i++) {
    languageDataLabel.push(languages[i].description.label);
    languageData.push(languages[i].proficiencylevel);
  }
}

// convert timeline and starRating to images
function createImages () {
  // convert timeline to image
  html2canvas(document.querySelector("#timeline")).then(canvas => {
    const item = document.querySelector("#timeline");
    item.innerHTML = '';
    item.appendChild(canvas);
  });

  // convert starRating to image
  html2canvas(document.querySelector("#digital")).then(canvas => {
    const item = document.querySelector("#digital");
    item.innerHTML = '';
    item.appendChild(canvas);
  });
}

/*\
|*|  JXON Snippet #3 - Mozilla Developer Network
|*|  https://developer.mozilla.org/en-US/docs/JXON
|*|  https://developer.mozilla.org/User:fusionchess
|*|  This framework is released under the GNU Public License, version 3 or later.
|*|  http://www.gnu.org/licenses/gpl-3.0-standalone.html
\*/

// helper function to convert xml to js object
function parseText (sValue) {
  if (/^\s*$/.test(sValue)) { return null; }
  if (/^(?:true|false)$/i.test(sValue)) { return sValue.toLowerCase() === "true"; }
  if (isFinite(sValue)) { return parseFloat(sValue); }
  if (isFinite(Date.parse(sValue))) { return new Date(sValue); }
  return sValue;
}

// helper function to convert xml to js object
function getJXONTree (oXMLParent) {
  let vResult = /* put here the default value for empty nodes! */ true, nLength = 0, sCollectedTxt = "";
  if (oXMLParent.hasAttributes && oXMLParent.hasAttributes()) {
    vResult = {};
    for (nLength; nLength < oXMLParent.attributes.length; nLength++) {
      oAttrib = oXMLParent.attributes.item(nLength);
      vResult["@" + oAttrib.name.toLowerCase()] = parseText(oAttrib.value.trim());
    }
  }
  if (oXMLParent.hasChildNodes()) {
    for (let oNode, sProp, vContent, nItem = 0; nItem < oXMLParent.childNodes.length; nItem++) {
      oNode = oXMLParent.childNodes.item(nItem);
      if (oNode.nodeType === 4) { sCollectedTxt += oNode.nodeValue; } /* nodeType is "CDATASection" (4) */
      else if (oNode.nodeType === 3) { sCollectedTxt += oNode.nodeValue.trim(); } /* nodeType is "Text" (3) */
      else if (oNode.nodeType === 1 && !oNode.prefix) { /* nodeType is "Element" (1) */
        if (nLength === 0) { vResult = {}; }
        sProp = oNode.nodeName.toLowerCase();
        vContent = getJXONTree(oNode);
        if (vResult.hasOwnProperty(sProp)) {
          if (vResult[sProp].constructor !== Array) { vResult[sProp] = [vResult[sProp]]; }
          vResult[sProp].push(vContent);
        } else { vResult[sProp] = vContent; nLength++; }
      }
    }
  }
  if (sCollectedTxt) { nLength > 0 ? vResult.keyValue = parseText(sCollectedTxt) : vResult = parseText(sCollectedTxt); }
  if (nLength > 0) { Object.freeze(vResult); }
  return vResult;
}

// show error in input label
( function ( document)
{
  const input = document.getElementById( 'files' );
  input.addEventListener( 'change', function()  {
    input.nextElementSibling.querySelector( 'span' ).innerHTML = 'Bitte gültige XML-Datei auswählen!';
  });

  // Firefox bug fix
  input.addEventListener( 'focus', function(){ input.classList.add( 'has-focus' ); });
  input.addEventListener( 'blur', function(){ input.classList.remove( 'has-focus' ); });
}( document ));