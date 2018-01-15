/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import {
  Inject,
  Injectable,
  PLATFORM_ID,
  Renderer2,
  RendererFactory2,
  RendererType2,
  ViewEncapsulation
} from '@angular/core';
import {DOCUMENT, isPlatformBrowser} from '@angular/common';

import {applyCssPrefixes} from '../auto-prefixer';
import {ServerStylesheet} from './server-stylesheet';

@Injectable()
export class StyleService {

  private _renderer: Renderer2;

  constructor(private _serverStylesheet: ServerStylesheet,
              private _rendererFactory: RendererFactory2,
              @Inject(DOCUMENT) private _document,
              @Inject(PLATFORM_ID) private _platformId) {
    this._renderer = this._rendererFactory.createRenderer(this._document, RENDERER_TYPE);
  }

  /**
   * Applies styles given via string pair or object map to the directive element.
   */
  applyStyleToElement(element: HTMLElement, style: StyleDefinition, value?: string | number) {
    if (isPlatformBrowser(this._platformId)) {
      let styles = {};
      if (typeof style === 'string') {
        styles[style] = value;
        style = styles;
      }
      styles = applyCssPrefixes(style);
      this._applyMultiValueStyleToElement(styles, element);
    } else {
      this._serverStylesheet.addStyleToElement(element, style, value);
    }
  }

  /**
   * Applies styles given via string pair or object map to the directive's element.
   */
  applyStyleToElements(style: StyleDefinition, elements: HTMLElement[]) {
    if (isPlatformBrowser(this._platformId)) {
      const styles = applyCssPrefixes(style);
      elements.forEach(el => {
        this._applyMultiValueStyleToElement(styles, el);
      });
    } else {
      this._serverStylesheet.addStyleToElements(style, elements || []);
    }
  }

  /**
   * Find the DOM element's raw attribute value (if any)
   */
  lookupAttributeValue(element: HTMLElement, attribute: string): string {
    return element.getAttribute(attribute) || '';
  }

  /**
   * Find the DOM element's inline style value (if any)
   */
  lookupInlineStyle(element: HTMLElement, styleName: string): string {
    return element.style[styleName];
  }

  /**
   * Determine the inline or inherited CSS style
   * @TODO(CaerusKaru): platform-server has no implementation for getComputedStyle
   */
  lookupStyle(element: HTMLElement, styleName: string, inlineOnly = false): string {
    if (isPlatformBrowser(this._platformId)) {
      let value = '';
      if (element) {
        let immediateValue = value = this.lookupInlineStyle(element, styleName);
        if (!inlineOnly) {
          value = immediateValue || getComputedStyle(element).getPropertyValue(styleName);
        }
      }

      // Note: 'inline' is the default of all elements, unless UA stylesheet overrides;
      //       in which case getComputedStyle() should determine a valid value.
      return value ? value.trim() : 'block';
    } else {
      return this._serverStylesheet.getStyleForElement(element, styleName);
    }
  }

  /**
   * Applies the styles to the element. The styles object map may contain an array of values.
   * Each value will be added as element style.
   * Keys are sorted to add prefixed styles (like -webkit-x) first, before the standard ones.
   */
  private _applyMultiValueStyleToElement(styles: {}, element: any) {
    Object.keys(styles).sort().forEach(key => {
      const values = Array.isArray(styles[key]) ? styles[key] : [styles[key]];
      values.sort();
      for (let value of values) {
        this._renderer.setStyle(element, key, value);
      }
    });
  }
}

/**
 * Definition of a css style. Either a property name (e.g. "flex-basis") or an object
 * map of property name and value (e.g. {display: 'none', flex-order: 5}).
 */
export type StyleDefinition = string | { [property: string]: string | number | null };

const RENDERER_TYPE: RendererType2 = {
  id: '-1',
  encapsulation: ViewEncapsulation.None,
  styles: [],
  data: {}
};

