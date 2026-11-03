/**
 * 10Web plugins Gutenberg integration
 * version 2.0.7
 *
 * iframe editor compatible: portals the shortcode modal to the admin document,
 * resolves callbacks across nested iframes, and registers apiVersion 3.
 */
( function ( blocks, element, blockEditor ) {
  var el = element.createElement;
  var useEffect = element.useEffect;
  var useState = element.useState;
  var useRef = element.useRef;
  var useBlockProps = blockEditor && blockEditor.useBlockProps ? blockEditor.useBlockProps : null;

  var TW_GB_MESSAGE_TYPE = 'tw-gb-shortcode';
  var EDITOR_LAYOUT_SELECTORS = '.edit-post-layout, .edit-post-layout__content, .interface-interface-skeleton, .interface-interface-skeleton__content';

  bindTwGbMessageListener();
  registerAllPluginBlocks();

  function bindTwGbMessageListener() {
    if ( window._twGbMessageBound ) {
      return;
    }
    window._twGbMessageBound = true;
    window.addEventListener( 'message', function ( event ) {
      if ( !event.data || event.data.type !== TW_GB_MESSAGE_TYPE ) {
        return;
      }
      if ( event.origin !== window.location.origin ) {
        return;
      }
      var name = event.data.callback;
      if ( name && typeof window[name] === 'function' ) {
        window[name]( event.data.shortcode, event.data.shortcode_id );
      }
    } );
  }

  function getAdminDocument() {
    return window.document;
  }

  function setEditorLayoutStacking( enabled ) {
    var $ = window.jQuery;
    if ( !$ ) {
      return;
    }
    $( getAdminDocument() ).find( EDITOR_LAYOUT_SELECTORS ).css(
      enabled
        ? { 'z-index': '99999', 'overflow': 'visible' }
        : { 'z-index': '', 'overflow': '' }
    );
  }

  function generateUniqueCbName( pluginId ) {
    return 'wdg_cb_' + pluginId;
  }

  function parseShortcodeId( shortcode, shortcodeId ) {
    if ( shortcodeId !== undefined && shortcodeId !== null && String( shortcodeId ) !== '' && String( shortcodeId ) !== 'undefined' ) {
      var fromAttr = String( shortcodeId ).match( /\d+/ );
      if ( fromAttr ) {
        return fromAttr[0];
      }
    }
    if ( shortcode ) {
      var match = String( shortcode ).match( /\bid\s*=\s*["']?(\d+)/i );
      if ( match && match[1] ) {
        return match[1];
      }
    }
    return '';
  }

  function registerAllPluginBlocks() {
    var twPluginsData = JSON.parse( tw_obj_translate.blocks );
    for ( var pluginId in window['tw_gb'] ) {
      if ( !window['tw_gb'].hasOwnProperty( pluginId ) ) {
        continue;
      }
      twPluginsData[pluginId] = window['tw_gb'][pluginId];
    }
    if ( !twPluginsData ) {
      return;
    }

    for ( var id in twPluginsData ) {
      if ( !twPluginsData.hasOwnProperty( id ) ) {
        continue;
      }

      if ( !twPluginsData[id].inited ) {
        twPluginsData[id].inited = true;
        registerPluginBlock( id, twPluginsData[id] );
      }
    }
  }

  function registerPluginBlock( pluginId, pluginData ) {
    var isPopup = pluginData.isPopup;
    var iconEl = el( 'img', {
      width: pluginData.iconSvg.width,
      height: pluginData.iconSvg.height,
      src: pluginData.iconSvg.src
    } );

    function Edit( props ) {
      var blockProps = useBlockProps
        ? useBlockProps( {
            className: 'tw-gb-block-editor'
          } )
        : { className: 'tw-gb-block-editor' };
      var shortcodeCbName = generateUniqueCbName( pluginId );
      var attributes = props.attributes;
      var shortcode = attributes.shortcode || '';
      var shortcodeId = attributes.shortcode_id || '';
      var editId = parseShortcodeId( shortcode, shortcodeId );

      var popupState = useState( !shortcode );
      var popupOpened = popupState[0];
      var setPopupOpened = popupState[1];
      var openedOnceRef = useRef( false );

      useEffect( function () {
        if ( !openedOnceRef.current && !shortcode ) {
          openedOnceRef.current = true;
          setPopupOpened( true );
        }
      }, [ shortcode ] );

      // Keep shortcode_id in sync when we can parse it from the shortcode text.
      useEffect( function () {
        if ( editId && String( shortcodeId ) !== String( editId ) ) {
          props.setAttributes( { shortcode_id: String( editId ) } );
        }
      }, [ editId ] );

      // Imperatively mount the modal iframe on the admin document so the
      // shortcode_bwg request always fires (createPortal can miss in iframed editors).
      useEffect( function () {
        if ( !popupOpened || !isPopup ) {
          return undefined;
        }

        bindTwGbMessageListener();

        var doc = getAdminDocument();
        var shortcodeUrl = pluginData.data && pluginData.data.shortcodeUrl;
        if ( !shortcodeUrl || !doc || !doc.body ) {
          return undefined;
        }

        var resolvedId = parseShortcodeId( shortcode, shortcodeId );

        // Match legacy URL shape: do NOT encodeURIComponent the callback.
        // encodeURIComponent turns "tw/bwg" into "tw%2Fbwg", and %2F is often blocked.
        var iframeSrc = shortcodeUrl +
          '&callback=' + shortcodeCbName +
          '&edit=' + ( resolvedId || '' ) +
          '&shortcode=' + ( shortcode || '' );

        var container = doc.createElement( 'div' );
        container.className = 'tw-container';
        container.setAttribute( 'role', 'dialog' );
        container.setAttribute( 'aria-modal', 'true' );

        var wrap = doc.createElement( 'div' );
        wrap.className = 'tw-container-wrap' + ( pluginData.containerClass ? ' ' + pluginData.containerClass : '' );

        var closeBtn = doc.createElement( 'button' );
        closeBtn.type = 'button';
        closeBtn.className = 'media-modal-close';
        closeBtn.innerHTML = '<span class="media-modal-icon"></span>';
        closeBtn.addEventListener( 'click', function ( event ) {
          event.preventDefault();
          event.stopPropagation();
          setPopupOpened( false );
        } );

        var iframe = doc.createElement( 'iframe' );
        iframe.title = pluginData.title || 'Photo Gallery';
        iframe.src = iframeSrc;

        wrap.appendChild( closeBtn );
        wrap.appendChild( iframe );
        container.appendChild( wrap );
        doc.body.appendChild( container );

        window[shortcodeCbName + '_shortcode'] = shortcode || '';
        window[shortcodeCbName] = function ( nextShortcode, nextShortcodeId ) {
          delete window[shortcodeCbName];
          setEditorLayoutStacking( false );
          setPopupOpened( false );
          props.setAttributes( {
            shortcode: nextShortcode,
            shortcode_id: nextShortcodeId !== undefined && nextShortcodeId !== null && nextShortcodeId !== ''
              ? String( nextShortcodeId )
              : parseShortcodeId( nextShortcode, '' )
          } );
        };
        setEditorLayoutStacking( true );

        return function () {
          setEditorLayoutStacking( false );
          if ( window[shortcodeCbName] ) {
            delete window[shortcodeCbName];
          }
          if ( container && container.parentNode ) {
            container.parentNode.removeChild( container );
          }
        };
      }, [ popupOpened, shortcode, shortcodeId, isPopup ] );

      function openPopup( event ) {
        if ( popupOpened ) {
          return;
        }
        if ( event ) {
          if ( event.preventDefault ) {
            event.preventDefault();
          }
          if ( event.stopPropagation ) {
            event.stopPropagation();
          }
        }
        setPopupOpened( true );
      }

      function chooseFromList( event ) {
        var selected = event.target.querySelector( 'option:checked' );
        props.setAttributes( {
          shortcode: selected.value,
          shortcode_id: selected.dataId ? String( selected.dataId ) : ''
        } );
        setPopupOpened( false );
        event.preventDefault();
      }

      function renderShortcodeList() {
        var children = [];
        var shortcodeList = JSON.parse( pluginData.data );
        shortcodeList.inputs.forEach( function ( inputItem ) {
          if ( inputItem.type === 'select' ) {
            children.push( el( 'option', { value: '', dataId: 0 }, tw_obj_translate.empty_item ) );
            if ( inputItem.options.length ) {
              inputItem.options.forEach( function ( optionItem ) {
                var itemShortcode = '[' + shortcodeList.shortcode_prefix + ' ' + inputItem.shortcode_attibute_name + '="' + optionItem.id + '"]';
                children.push(
                  el( 'option', { value: itemShortcode, dataId: optionItem.id }, optionItem.name )
                );
              } );
            }
          }
        } );

        if ( shortcodeList.shortcodes ) {
          shortcodeList.shortcodes.forEach( function ( shortcodeItem ) {
            children.push(
              el( 'option', { value: shortcodeItem.shortcode, dataId: shortcodeItem.id }, shortcodeItem.name )
            );
          } );
        }

        return el(
          'form',
          { onSubmit: chooseFromList },
          el( 'div', {}, pluginData.titleSelect ),
          el( 'select', {
            value: shortcode,
            onChange: chooseFromList,
            className: 'tw-gb-select'
          }, children )
        );
      }

      function renderCanvas() {
        if ( shortcode ) {
          var iconWidth = pluginData.title == 'Photo Gallery' ? 'auto' : '36px';
          var iconHeight = pluginData.title == 'Photo Gallery' ? 'auto' : '36px';
          return el( 'img', {
            src: pluginData.iconUrl,
            alt: pluginData.title,
            style: {
              height: iconHeight,
              width: iconWidth,
              cursor: 'pointer'
            }
          } );
        }
        return el( 'p', {
          style: {
            cursor: 'pointer'
          }
        }, tw_obj_translate.nothing_selected );
      }

      if ( popupOpened && !isPopup ) {
        return el( 'div', blockProps, renderShortcodeList() );
      }

      return el(
        'div',
        Object.assign( {}, blockProps, {
          onClick: openPopup,
          onKeyDown: function ( event ) {
            if ( event.key === 'Enter' || event.key === ' ' ) {
              openPopup( event );
            }
          },
          role: 'button',
          tabIndex: 0
        } ),
        renderCanvas()
      );
    }

    blocks.registerBlockType( pluginId, {
      apiVersion: 3,
      title: pluginData.title,
      icon: iconEl,
      category: 'common',
      attributes: {
        shortcode: {
          type: 'string',
          default: ''
        },
        shortcode_id: {
          type: 'string',
          default: ''
        }
      },
      edit: Edit,
      save: function ( props ) {
        return props.attributes.shortcode || '';
      }
    } );
  }
} )(
  window.wp.blocks,
  window.wp.element,
  window.wp.blockEditor || {}
);
