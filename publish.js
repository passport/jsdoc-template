var doop = require('jsdoc/util/doop');
var env = require('jsdoc/env');
var helper = require('jsdoc/util/templateHelper');
var taffy = require('taffydb').taffy;
var path = require('jsdoc/path');
const template = require('jsdoc/template');
var fs = require('jsdoc/fs');
var util = require('util');
var uri = require('url')

var htmlsafe = helper.htmlsafe;
var linkto = helper.linkto;
var resolveAuthorLinks = helper.resolveAuthorLinks;
var hasOwnProp = Object.prototype.hasOwnProperty;

// https://github.com/jsdoc/jsdoc/tree/main/packages/jsdoc/templates

var data;
var view;
var packageJSON;

var outdir = path.normalize(env.opts.destination);

function x_prettyURL(name) {
  var dirname = path.dirname(name)
    , basename = path.basename(name, '.html')
    , extname = path.extname(name)
  
  if ('.html' === extname) {
    basename = 'index' !== basename ? basename : '';
    
    //page.url = path.join(dirname, basename) + '/';
    //page.outputPath = path.join(page.basePath || '', dirname, basename, index + ext);
    
    //return path.join(dirname, basename, 'index.html').toLowerCase();
    
    var p = path.join(dirname, basename).toLowerCase();
    //console.log(p);
    
    return p !== '.' ? p + '/' : '';
    //return path.join(dirname, basename).toLowerCase() + '/';
  }
  
  return name;
}

// Equivalent to helper.createLink, but using desired path naming conventions
function x_createLink(doclet) {
  var out = helper.createLink(doclet);
  //console.log('--! x_createLink');
  //console.log(out);
  //console.log(doclet);
  
  if (doclet.kind == 'module' && doclet.name == packageJSON.name) {
    //console.log('**** MAKE IT INDEX *****');
    //console.log(out);
    
    out = 'index.html';
  }
  //console.log(out);
  
  
  //console.log(doclet.longname + ' : ' + out);
  var i = out.indexOf('#');
  //console.log(i);
  
  var p = i === -1 ? out : out.slice(0, i)
    , f = i === -1 ? undefined : out.slice(i);
  
  //console.log('P: ' + p);
  //console.log('F: ' + f);
  
  
  var pu = x_prettyURL(p);
  //console.log('OUT: ' + out);
  //console.log('pu: ' + pu)
  var opu = pu + (f ? f : '');
  
  var root = '/api/passport-local/1.x/';
  var ru = uri.resolve(root, opu)
  //var root = '/api/passport-local/1.x/';
  //var ru = path.resolve(root, opu)
  
  //console.log('opu: ' + opu)
  //console.log(ru);
  
  
  
  //return out;
  //return opu;
  return ru;
}

// TODO: Remvoe this?
function x_linkto(longname, linkText, cssClass, fragmentId) {
  // /console.log('XXXX LINK TO: ');
  
  var out = linkto.apply(undefined, arguments);
  
  
  var regex = /(<a[^>]*href=["'])([^"']*)(["'])/g;
  var match = regex.exec(out)
  if (!match) {
    //console.log('NO MATCH: ' + out)
    return out;
  }
  
  //console.log('LINK: ' + out);
  
  //console.log(match);
  //console.log(match[2]);
  var u = match[2];
  //console.log('ORIG U: ' + u);
  
  var i = u.indexOf('#');
  var p = i === -1 ? u : u.slice(0, i)
    , f = i === -1 ? undefined : u.slice(i);
  
  //var ix = p.indexOf('index.html');
  //console.log(ix);
  
  //var op = p.slice(0, ix)
  //console.log(op);
  var opu = p + (f ? f : '');
  //console.log(opu);
  
  opu = 'https://www.passportjs.org/api/passport-local/1.x/' + opu;
  //console.log(opu);
  
  var rout = out.replace(regex, '$1' + opu + '$3');
  //console.log(rout);
  
  //return util.format('<a href="%s"%s>%s</a>', encodeURI(fileUrl + fragmentString),
  //          classString, text);
  
  
  return rout;
}


function find(spec) {
  return helper.find(data, spec);
}

function tutoriallink(tutorial) {
  return helper.toTutorial(tutorial, null, {
    tag: 'em',
    classname: 'disabled',
    prefix: 'Tutorial: '
  });
}

function getAncestorLinks(doclet) {
  return helper.getAncestorLinks(data, doclet);
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
  //console.log(item);
  
  var attributes = getSignatureAttributes(item);
  var itemName = item.name || '';

  if (item.variable) {
    itemName = '&hellip;' + itemName;
  }

  /*
  if (attributes && attributes.length) {
    itemName = util.format( '%s<span class="signature-attributes x-sig-att">%s</span>', itemName,
      attributes.join(', ') );
  }
  */
  
  if (item.optional) {
    itemName = '[' + itemName + ']'
  }

  return itemName;
}

function addParamAttributes(params) {
  return params.filter(function(param) {
    return param.name && param.name.indexOf('.') === -1;
  }).map(updateItemName);
}

function buildItemTypeStrings(item) {
  var types = [];

  if (item && item.type && item.type.names) {
    item.type.names.forEach(function(name) {
      types.push( linkto(name, htmlsafe(name)) );
    });
  }

  return types;
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
  
  //console.log('XX: ' + f.signature);

  f.signature = '<span class="signature">' + (f.signature || '') + '</span>' +
      '<span class="type-signature">' + returnTypesString + '</span>';
}

function addSignatureTypes(f) {
  var types = f.type ? buildItemTypeStrings(f) : [];

  f.signature = (f.signature || '') + '<span class="type-signature">' +
    (types.length ? ' :' + types.join('|') : '') + '</span>';
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

function generate(title, docs, filename, resolveLinks) {
  //console.log('GENERATE: ' + filename);
  
  var docData;
  var html;
  var outpath;

  resolveLinks = resolveLinks !== false;

  docData = {
    env: env,
    title: title,
    docs: docs,
    package: packageJSON
  };

  //console.log(docData.env)

  //var root = 'https://www.passportjs.org/api/passport-local/1.x/';
  var root = '/api/passport-local/1.x/';
  var fn = filename.slice(root.length)


  //outpath = path.join(outdir, filename);
  //outpath = path.join(outdir, filename, 'index.html');
  outpath = path.join(outdir, fn, 'index.html');
  html = view.render('container.tmpl', docData);

  if (resolveLinks) {
    //console.log('XXX RESOVLE LINKS');
    //console.log(html);
    
    html = helper.resolveLinks(html); // turn {@link foo} into <a href="foodoc.html">foo</a>
    //console.log(html);
    //console.log('XXX RESOVLE LINKS');
  }

  console.log('OUTPATH: ' + outpath);

  var toDir = fs.toDir( outpath );
  fs.mkPath(toDir);
  fs.writeFileSync(outpath, html, 'utf8');
}

/**
 * Look for classes or functions with the same name as modules (which indicates that the module
 * exports only that class or function), then attach the classes or functions to the `module`
 * property of the appropriate module doclets. The name of each class or function is also updated
 * for display purposes. This function mutates the original arrays.
 *
 * @private
 * @param {Array.<module:jsdoc/doclet.Doclet>} doclets - The array of classes and functions to
 * check.
 * @param {Array.<module:jsdoc/doclet.Doclet>} modules - The array of module doclets to search.
 */
function attachModuleSymbols(doclets, modules) {
  var symbols = {};

  // build a lookup table
  doclets.forEach(function(symbol) {
    symbols[symbol.longname] = symbols[symbol.longname] || [];
    symbols[symbol.longname].push(symbol);
  });

  modules.forEach(function(module) {
    if (symbols[module.longname]) {
      module.modules = symbols[module.longname]
        // Only show symbols that have a description. Make an exception for classes, because
        // we want to show the constructor-signature heading no matter what.
        .filter(function(symbol) {
          return symbol.description || symbol.kind === 'class';
        })
        .map(function(symbol) {
          symbol = doop(symbol);

          if (symbol.kind === 'class' || symbol.kind === 'function') {
            symbol.name = symbol.name.replace('module:', '(require("') + '"))';
          }

          return symbol;
        });
    }
  });
}

function buildMemberNav(items, itemHeading, itemsSeen, linktoFn) {
  var nav = '';

  if (items.length) {
    var itemsNav = '';

    items.forEach(function(item) {
      //console.log(item);
      var displayName;

      if ( !hasOwnProp.call(item, 'longname') ) {
        itemsNav += '<li>' + linktoFn('', item.name) + '</li>';
      }
      else if ( !hasOwnProp.call(itemsSeen, item.longname) ) {
        if (env.conf.templates.default.useLongnameInNav) {
          displayName = item.longname;
        } else {
          displayName = item.name;
        }
        itemsNav += '<h3>' + linktoFn(item.longname, displayName.replace(/\b(module|event):/g, '')) + '</h3>';

        itemsSeen[item.longname] = true;
      }
      
      var members = find({kind: 'member', memberof: item.longname});
      if (members && members.length) {
        itemsNav += '<h4>Properties</h4>';
        itemsNav += '<ul>';
        members.forEach(function(m) {
          itemsNav += '<li>.' + m.name + '</li>';
        });
        itemsNav += '</ul>';
      }
      
      var methods = find({kind: 'function', memberof: item.longname});
      //console.log(methods)
      
      if (methods && methods.length) {
        itemsNav += '<h4>Methods</h4>';
        itemsNav += '<ul>';
        
        methods.forEach(function(m) {
          itemsNav += '<li>.' + m.name + '()</li>';
        });
        
        itemsNav += '</ul>';
      }
    });

    //console.log(itemsNav);

    if (itemsNav !== '') {
      //nav += '<h3>' + itemHeading + '</h3><ul>' + itemsNav + '</ul>';
      //nav += '<ul>' + itemsNav + '</ul>';
      nav += itemsNav;
    }
  }

  return nav;
}

function linktoTutorial(longName, name) {
  return tutoriallink(name);
}

function linktoExternal(longName, name) {
  return linkto(longName, name.replace(/(^"|"$)/g, ''));
}

/**
 * Create the navigation sidebar.
 * @param {object} members The members that will be used to create the sidebar.
 * @param {array<object>} members.classes
 * @param {array<object>} members.externals
 * @param {array<object>} members.globals
 * @param {array<object>} members.mixins
 * @param {array<object>} members.modules
 * @param {array<object>} members.namespaces
 * @param {array<object>} members.tutorials
 * @param {array<object>} members.events
 * @param {array<object>} members.interfaces
 * @return {string} The HTML for the navigation sidebar.
 */
function buildNav(members) {
  //console.log(members.modules)
  
  var globalNav;
  //var nav = '<h2><a href="index.html">Home</a></h2>';
  var nav = '<h2><a href="' + x_createLink(members.modules[0]) + '">' + members.modules[0].name + '</a></h2>';
  var seen = {};
  var seenTutorials = {};

  //nav += buildMemberNav(members.modules, 'Modules', {}, linkto);
  //nav += buildMemberNav(members.externals, 'Externals', seen, linktoExternal);
  //nav += buildMemberNav(members.classes, 'Classes', seen, x_linkto);
  nav += buildMemberNav(members.classes, 'Classes', seen, linkto);
  //nav += buildMemberNav(members.events, 'Events', seen, linkto);
  //nav += buildMemberNav(members.namespaces, 'Namespaces', seen, linkto);
  //nav += buildMemberNav(members.mixins, 'Mixins', seen, linkto);
  //nav += buildMemberNav(members.tutorials, 'Tutorials', seenTutorials, linktoTutorial);
  //nav += buildMemberNav(members.interfaces, 'Interfaces', seen, linkto);

  if (members.globals.length) {
    globalNav = '';

    members.globals.forEach(function(g) {
      if ( g.kind !== 'typedef' && !hasOwnProp.call(seen, g.longname) ) {
        globalNav += '<li>' + linkto(g.longname, g.name) + '</li>';
      }
      seen[g.longname] = true;
    });

    if (!globalNav) {
      // turn the heading into a link so you can actually get to the global page
      nav += '<h3>' + linkto('global', 'Global') + '</h3>';
    }
    else {
      nav += '<h3>Global</h3><ul>' + globalNav + '</ul>';
    }
  }

  //console.log(nav);

  return nav;
}


/**
    @param {TAFFY} data See <http://taffydb.com/>.
    @param {object} opts
 */
exports.publish = function(taffyData, opts) {
  //console.log('template publish');
  //console.log(opts);
  //console.log(env)
  
  //console.log(data);
  //console.log(opts);
  //console.log(data());
  
  var classes;
  var externals;
  var conf;
  var files;
  var fromDir;
  var globalUrl;
  var indexUrl;
  var interfaces;
  var mixins;
  var modules;
  var namespaces;
  var members;
  var outputSourceFiles;
  var packageInfo;
  var packages;
  var sourceFilePaths = [];
  var sourceFiles = {};
  var staticFiles;
  var templatePath;
  //var packageJSON;
  
  // TODO: remove this in favor of packageInfo
  var pdata = fs.readFileSync(opts.package || 'package.json', 'utf8');
  packageJSON = JSON.parse(pdata);
  
  //console.log(packageJSON);
  
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
    //console.log(packageInfo);
    //outdir = path.join( outdir, packageInfo.name, (packageInfo.version || '') );
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
  //console.log(helper.longnameToUrl)
  //console.log('****')
  
  data().each(function(doclet) {
    var docletPath;
    //var url = helper.createLink(doclet);
    var url = x_createLink(doclet);
    //console.log('? ' + doclet.longname + ' : ' + url)
  
    
    // WIP
    // /console.log(helper.longnameToUrl)

    helper.registerLink(doclet.longname, url);
    
    //console.log(helper.longnameToUrl)
    //console.log('---')

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
  
  // do this after the urls have all been generated
  data().each(function(doclet) {
    doclet.ancestors = getAncestorLinks(doclet);

    if (doclet.kind === 'member') {
      addSignatureTypes(doclet);
      addAttribs(doclet);
    }

    if (doclet.kind === 'constant') {
      addSignatureTypes(doclet);
      addAttribs(doclet);
      doclet.kind = 'member';
    }
  });
  
  
  members = helper.getMembers(data);
  members.tutorials = [];
  
  // output pretty-printed source files by default
  outputSourceFiles = conf.default && conf.default.outputSourceFiles !== false;
  
  // add template helpers
  view.find = find;
  view.linkto = linkto;
  //view.linkto = x_linkto;
  view.resolveAuthorLinks = resolveAuthorLinks;
  view.tutoriallink = tutoriallink;
  view.htmlsafe = htmlsafe;
  view.outputSourceFiles = outputSourceFiles;
  
  // once for all
  view.nav = buildNav(members);
  //console.log(view.nav);
  attachModuleSymbols( find({ longname: {left: 'module:'} }), members.modules );
  
  // generate the pretty-printed source files first so other pages can link to them
  /*
  if (outputSourceFiles) {
    generateSourceFiles(sourceFiles, opts.encoding);
  }
  */
  
  if (members.globals.length) { generate('Global', [{kind: 'globalobj'}], globalUrl); }
  
  // index page displays information from package.json and lists files
  files = find({kind: 'file'});
  packages = find({kind: 'package'});
  
  /*
  generate('Home',
    packages.concat(
      [{
        kind: 'mainpage',
        readme: opts.readme,
        longname: (opts.mainpagetitle) ? opts.mainpagetitle : 'Main Page'
      }]
    ).concat(files), indexUrl);
  */
  
  // set up the lists that we'll use to generate pages
  classes = taffy(members.classes);
  modules = taffy(members.modules);
  namespaces = taffy(members.namespaces);
  mixins = taffy(members.mixins);
  externals = taffy(members.externals);
  interfaces = taffy(members.interfaces);
  
  
  Object.keys(helper.longnameToUrl).forEach((longname) => {
    var myClasses = helper.find(classes, {longname: longname});
    var myExternals = helper.find(externals, {longname: longname});
    var myInterfaces = helper.find(interfaces, {longname: longname});
    var myMixins = helper.find(mixins, {longname: longname});
    var myModules = helper.find(modules, {longname: longname});
    var myNamespaces = helper.find(namespaces, {longname: longname});
    
    if (myModules.length) {
      //console.log('MY MODULES');
      //console.log(myModules);
      //console.log('----')
      //console.log(helper.longnameToUrl)
      
      generate('Module: ' + myModules[0].name, myModules, helper.longnameToUrl[longname]);
    }
    
    //console.log(packageInfo)
    
    if (myClasses.length) {
      generate(myClasses[0].name, myClasses, helper.longnameToUrl[longname]);
    }
    
    if (myNamespaces.length) {
      generate('Namespace: ' + myNamespaces[0].name, myNamespaces, helper.longnameToUrl[longname]);
    }

    if (myMixins.length) {
      generate('Mixin: ' + myMixins[0].name, myMixins, helper.longnameToUrl[longname]);
    }

    if (myExternals.length) {
      generate('External: ' + myExternals[0].name, myExternals, helper.longnameToUrl[longname]);
    }

    if (myInterfaces.length) {
      generate('Interface: ' + myInterfaces[0].name, myInterfaces, helper.longnameToUrl[longname]);
    }
  });
};
