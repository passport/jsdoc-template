var helper = require('jsdoc/util/templateHelper');
var taffy = require('taffydb').taffy;
var path = require('jsdoc/path');
const template = require('jsdoc/template');
var fs = require('jsdoc/fs');
var util = require('util');

var htmlsafe = helper.htmlsafe;

// https://github.com/jsdoc/jsdoc/tree/main/packages/jsdoc/templates

var data;
var view;

var outdir = path.normalize(env.opts.destination);

function find(spec) {
  return helper.find(data, spec);
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

function needsSignature(doclet) {
  var needsSig = false;

  // function and class definitions always get a signature
  if (doclet.kind === 'function' || doclet.kind === 'class') {
    needsSig = true;
  }
  // typedefs that contain functions get a signature, too
  else if (doclet.kind === 'typedef' && doclet.type && doclet.type.names &&
    doclet.type.names.length) {
    for (var i = 0, l = doclet.type.names.length; i < l; i++) {
      if (doclet.type.names[i].toLowerCase() === 'function') {
        needsSig = true;
        break;
      }
    }
  }
  // and namespaces that are functions get a signature (but finding them is a
  // bit messy)
  else if (doclet.kind === 'namespace' && doclet.meta && doclet.meta.code &&
    doclet.meta.code.type && doclet.meta.code.type.match(/[Ff]unction/)) {
    needsSig = true;
  }

  return needsSig;
}

function getSignatureAttributes(item) {
  var attributes = [];

  if (item.optional) {
    attributes.push('opt');
  }

  if (item.nullable === true) {
    attributes.push('nullable');
  }
  else if (item.nullable === false) {
    attributes.push('non-null');
  }

  return attributes;
}

function updateItemName(item) {
  var attributes = getSignatureAttributes(item);
  var itemName = item.name || '';

  if (item.variable) {
    itemName = '&hellip;' + itemName;
  }

  if (attributes && attributes.length) {
    itemName = util.format( '%s<span class="signature-attributes">%s</span>', itemName,
      attributes.join(', ') );
  }

  return itemName;
}

function addParamAttributes(params) {
  return params.filter(function(param) {
    return param.name && param.name.indexOf('.') === -1;
  }).map(updateItemName);
}

function buildAttribsString(attribs) {
  var attribsString = '';

  if (attribs && attribs.length) {
    attribsString = htmlsafe( util.format('(%s) ', attribs.join(', ')) );
  }

  return attribsString;
}

function addSignatureParams(f) {
  var params = f.params ? addParamAttributes(f.params) : [];

  f.signature = util.format( '%s(%s)', (f.signature || ''), params.join(', ') );
}

function addSignatureReturns(f) {
  var attribs = [];
  var attribsString = '';
  var returnTypes = [];
  var returnTypesString = '';
  var source = f.yields || f.returns;

  // jam all the return-type attributes into an array. this could create odd results (for example,
  // if there are both nullable and non-nullable return types), but let's assume that most people
  // who use multiple @return tags aren't using Closure Compiler type annotations, and vice-versa.
  if (source) {
    source.forEach(function(item) {
      helper.getAttribs(item).forEach(function(attrib) {
        if (attribs.indexOf(attrib) === -1) {
          attribs.push(attrib);
        }
      });
    });

    attribsString = buildAttribsString(attribs);
  }

  if (source) {
    returnTypes = addNonParamAttributes(source);
  }
  if (returnTypes.length) {
    returnTypesString = util.format( ' &rarr; %s{%s}', attribsString, returnTypes.join('|') );
  }

  f.signature = '<span class="signature">' + (f.signature || '') + '</span>' +
      '<span class="type-signature">' + returnTypesString + '</span>';
}

function addAttribs(f) {
  var attribs = helper.getAttribs(f);
  var attribsString = buildAttribsString(attribs);

  f.attribs = util.format('<span class="type-signature">%s</span>', attribsString);
}

function shortenPaths(files, commonPrefix) {
  Object.keys(files).forEach(function(file) {
    files[file].shortened = files[file].resolved.replace(commonPrefix, '')
      // always use forward slashes
      .replace(/\\/g, '/');
  });

  return files;
}

function getPathFromDoclet(doclet) {
  if (!doclet.meta) {
    return null;
  }

  return doclet.meta.path && doclet.meta.path !== 'null' ?
    path.join(doclet.meta.path, doclet.meta.filename) :
    doclet.meta.filename;
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
  //var view = new template.Template(path.join(__dirname, 'tmpl'));
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
exports.publish = function(taffyData, opts) {
  console.log('template publish');
  console.log(opts);
  //console.log(env)
  
  //console.log(data);
  //console.log(opts);
  //console.log(data());
  
  var conf;
  var fromDir;
  var globalUrl;
  var indexUrl;
  var packageInfo;
  var sourceFilePaths = [];
  var sourceFiles = {};
  var staticFiles;
  var templatePath;
  
  data = taffyData;
  
  conf = env.conf.templates || {};
  conf.default = conf.default || {};
  
  templatePath = path.normalize(opts.template);
  view = new template.Template( path.join(templatePath, 'tmpl') );
  
  indexUrl = helper.getUniqueFilename('index');

  globalUrl = helper.getUniqueFilename('global');
  helper.registerLink('global', globalUrl);
  
  // set up templating
  view.layout = conf.default.layoutFile ?
    path.getResourcePath(path.dirname(conf.default.layoutFile),
      path.basename(conf.default.layoutFile) ) :
      'layout.tmpl';
  

  data = helper.prune(data);
  data.sort('longname, version, since');
  helper.addEventListeners(data);
  
  
  data().each(function(doclet) {
    var sourcePath;
    
    doclet.attribs = '';
  
    if (doclet.examples) {
      doclet.examples = doclet.examples.map(function(example) {
        var caption;
        var code;

        if (example.match(/^\s*<caption>([\s\S]+?)<\/caption>(\s*[\n\r])([\s\S]+)$/i)) {
          caption = RegExp.$1;
          code = RegExp.$3;
        }

        return {
          caption: caption || '',
          code: code || example
        };
      });
    }
    if (doclet.see) {
      doclet.see.forEach(function(seeItem, i) {
        doclet.see[i] = hashToLink(doclet, seeItem);
      });
    }
    
    // build a list of source files
    if (doclet.meta) {
      sourcePath = getPathFromDoclet(doclet);
      sourceFiles[sourcePath] = {
        resolved: sourcePath,
        shortened: null
      };
      if (sourceFilePaths.indexOf(sourcePath) === -1) {
        sourceFilePaths.push(sourcePath);
      }
    }
  });
  
  packageInfo = ( find({kind: 'package'}) || [] )[0];
  if (packageInfo && packageInfo.name) {
    outdir = path.join( outdir, packageInfo.name, (packageInfo.version || '') );
  }
  fs.mkPath(outdir);
  
  // copy the template's static files to outdir
  /*
  fromDir = path.join(templatePath, 'static');
  staticFiles = fs.ls(fromDir, 3);

  staticFiles.forEach(function(fileName) {
    var toDir = fs.toDir( fileName.replace(fromDir, outdir) );

    fs.mkPath(toDir);
    fs.copyFileSync(fileName, toDir);
  });
  */
  
  if (sourceFilePaths.length) {
    sourceFiles = shortenPaths( sourceFiles, path.commonPrefix(sourceFilePaths) );
  }
  data().each(function(doclet) {
    var docletPath;
    var url = helper.createLink(doclet);

    helper.registerLink(doclet.longname, url);

    // add a shortened version of the full path
    if (doclet.meta) {
      docletPath = getPathFromDoclet(doclet);
      docletPath = sourceFiles[docletPath].shortened;
      if (docletPath) {
        doclet.meta.shortpath = docletPath;
      }
    }
  });
  
  data().each(function(doclet) {
    var url = helper.longnameToUrl[doclet.longname];

    if (url.indexOf('#') > -1) {
      doclet.id = helper.longnameToUrl[doclet.longname].split(/#/).pop();
    }
    else {
      doclet.id = doclet.name;
    }

    if ( needsSignature(doclet) ) {
      addSignatureParams(doclet);
      addSignatureReturns(doclet);
      addAttribs(doclet);
    }
  });
  
  
  var members = helper.getMembers(data);
  //console.log(members);
  
  //console.log(taffy);
  
  
  
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
