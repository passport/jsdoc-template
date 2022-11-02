var helper = require('jsdoc/util/templateHelper');
var taffy = require('taffydb').taffy;
var path = require('path');
const template = require('jsdoc/template');


// https://github.com/jsdoc/jsdoc/tree/main/packages/jsdoc/templates



function generate(title, docs, filename, resolveLinks, outdir, dependencies) {
  console.log('generate! ' + title);
  //onsole.log(docs);
  //console.log(filename);
  //console.log(resolveLinks);
  //console.log(outdir);
  //console.log(dependencies);
  console.log('---')
  
  //const env = dependencies.get('env');
  var env
  
  const docData = {
    env: env,
    title: title,
    docs: docs,
  };
  
  
  //view = new template.Template(path.join(templatePath, 'tmpl'));
  
  //var view = new template.Template(path.join('tmpl'));
  var view = new template.Template(path.join(__dirname, 'tmpl'));
  console.log(view);
  
  var html = view.render('container.tmpl', docData);
  console.log(html);
  
}


/**
    @param {TAFFY} data See <http://taffydb.com/>.
    @param {object} opts
 */
exports.publish = function (data, opts) {
  console.log('template publish');
  console.log(opts);
  //console.log(data);
  //console.log(opts);
  
  
  //console.log(data());
  
  var outdir = path.normalize(opts.destination);
  
  
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
    const url = helper.longnameToUrl[doclet.longname];
    
    if (url.includes('#')) {
      doclet.id = helper.longnameToUrl[doclet.longname].split(/#/).pop();
    } else {
      doclet.id = doclet.name;
    }
    
  });
  
  
  // set up the lists that we'll use to generate pages
  var classes = taffy(members.classes);
  //console.log(classes);
  
  console.log(helper.longnameToUrl);
  
  
  Object.keys(helper.longnameToUrl).forEach((longname) => {
    console.log(longname)
    
    
    const myClasses = helper.find(classes, { longname: longname });
    //console.log(myClasses);
    
    if (myClasses.length) {
      console.log('GERNERATE CLASSES');
      
      generate(
        `Class: ${myClasses[0].name}`,
        myClasses,
        helper.longnameToUrl[longname],
        true,
        outdir,
        opts
      );
    }
    
    
  });
};
