var helper = require('jsdoc/util/templateHelper');
var taffy = require('taffydb').taffy;
var path = require('path');
const template = require('jsdoc/template');
const fs = require('fs');


// https://github.com/jsdoc/jsdoc/tree/main/packages/jsdoc/templates

function mkdirpSync(filepath) {
  return fs.mkdirSync(filepath, { recursive: true });
}

function hashToLink(doclet, hash) {
  var url;

  if ( !/^(#.+)/.test(hash) ) {
    return hash;
  }

  url = helper.createLink(doclet);
  url = url.replace(/(#.+|$)/, hash);

  return '<a href="' + url + '">' + hash + '</a>';
}

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
  
  console.log(docData);
  
  
  //view = new template.Template(path.join(templatePath, 'tmpl'));
  
  //var view = new template.Template(path.join('tmpl'));
  var view = new template.Template(path.join(__dirname, 'tmpl'));
  console.log(view);
  
  const outpath = path.join(outdir, filename);
  const html = view.render('container.tmpl', docData);
  console.log(html);
  console.log(outpath);
  
  fs.writeFileSync(outpath, html, 'utf8');
}


/**
    @param {TAFFY} data See <http://taffydb.com/>.
    @param {object} opts
 */
exports.publish = function (data, opts) {
  console.log('template publish');
  console.log(opts);
  //console.log(env)
  
  //console.log(data);
  //console.log(opts);
  //console.log(data());
  
  var conf;
  
  conf = env.conf.templates || {};
  conf.default = conf.default || {};
  
  
  var outdir = path.normalize(opts.destination);
  
  const globalUrl = helper.getUniqueFilename('global');
  helper.registerLink('global', globalUrl);
  

  data = helper.prune(data);
  data.sort('longname, version, since');
  helper.addEventListeners(data);
  
  
  data().each(function(doclet) {
    //console.log(doclet)
    
    doclet.attribs = '';
  
    if (doclet.examples) {
      console.log("**** EXAMPLES!")
      
      doclet.examples = doclet.examples.map((example) => {
        let caption;
        let code;

        if (example.match(/^\s*<caption>([\s\S]+?)<\/caption>(\s*[\n\r])([\s\S]+)$/i)) {
          caption = RegExp.$1;
          code = RegExp.$3;
        }

        return {
          caption: caption || '',
          code: code || example,
        };
      });
    }
    if (doclet.see) {
      //console.log("SEE")
      
      doclet.see.forEach((seeItem, i) => {
              doclet.see[i] = hashToLink(doclet, seeItem, dependencies);
        });
    }
    if (doclet.meta) {
      //console.log("META")
      //console.log(doclet)
    }
  });
  
  var packageInfo = (helper.find(data, {kind: 'package'}) || [])[0];
  console.log(packageInfo);
  
  console.log('MKDIR: ' + outdir);
  mkdirpSync(outdir);
  
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
