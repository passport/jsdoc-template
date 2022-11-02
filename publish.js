var helper = require('jsdoc/util/templateHelper');
var taffy = require('taffydb').taffy;


// https://github.com/jsdoc/jsdoc/tree/main/packages/jsdoc/templates

/**
    @param {TAFFY} data See <http://taffydb.com/>.
    @param {object} opts
 */
exports.publish = function (data, opts) {
  console.log('template publish');
  //console.log(data);
  //console.log(opts);
  
  
  //console.log(data());
  
  data = helper.prune(data, opts);
  
  
  data().each(function(doclet) {
    //console.log(doclet)
  
    if (doclet.examples) {
      //console.log("EXAMPLE!")
    }
    if (doclet.see) {
      //console.log("SEE")
    }
    if (doclet.meta) {
      //console.log("META")
      //console.log(doclet)
    }
  });
  
  var packageInfo = (helper.find(data, {kind: 'package'}) || [])[0];
  console.log(packageInfo);
  
  var members = helper.getMembers(data);
  //console.log(members);
  
  //console.log(taffy);
  
  
  data().each((doclet) => {
    const url = helper.createLink(doclet, opts);
    console.log('*: ' + url);
    
    helper.registerLink(doclet.longname, url);
    
  });
  
  
  data().each((doclet) => {
    console.log('!: ' + doclet.longname);
    
    const url = helper.longnameToUrl[doclet.longname];
    console.log(url);
    
    //if (url.includes('#')) {
    //  
    //}
    
  });
  
  
  // set up the lists that we'll use to generate pages
  var classes = taffy(members.classes);
  //console.log(classes);
  
  console.log(helper.longnameToUrl);
  
  /*
  Object.keys(helper.longnameToUrl).forEach((longname) => {
    console.log(longname)
  });
  */
};
