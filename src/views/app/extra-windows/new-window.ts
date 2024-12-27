/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/no-empty-function */
/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 * SPDX-License-Identifier: AGPL-3.0-only
 */

/*
 * MIT License
 *
 * Copyright (c) 2017 Rubens Mariuzzo
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

import React, { ReactNode, ReactPortal } from 'react';

import ReactDOM from 'react-dom';

type CSSRuleType = CSSRule & {
	name?: string;
	keyText?: string;
	cssRules?: CSSRuleList;
	style?: CSSStyleDeclaration;
};

interface WindowFeatures {
	[key: string]: string | boolean | number;
}

interface NewWindowProps {
	children?: ReactNode;
	url?: string;
	name?: string;
	title?: string;
	features?: WindowFeatures;
	onUnload: () => void;
	onBlock?: () => void;
	onOpen?: (window: Window | null) => void;
	center?: 'parent' | 'screen';
	copyStyles?: boolean;
	closeOnUnmount?: boolean;
}

/**
 * Generate keyframe text from a CSS rule.
 * @param cssRule - The CSS rule.
 * @returns The keyframe text.
 */
function getKeyFrameText(cssRule: CSSRuleType): string {
	const tokens = ['@keyframes', cssRule.name ?? '', '{'];
	Array.from(cssRule.cssRules ?? []).forEach((rule: CSSRuleType) => {
		tokens.push((rule as CSSRuleType).keyText ?? '', '{', rule.style?.cssText ?? '', '}');
	});
	tokens.push('}');
	return tokens.join(' ');
}

/**
 * Handle local import URLs in a CSS rule.
 * @param cssRule - The CSS rule.
 * @returns The updated CSS text.
 */
function fixUrlForRule(cssRule: CSSRule): string {
	return cssRule.cssText
		.split('url(')
		.map((line) => {
			if (line[1] === '/') {
				return `${line.slice(0, 1)}${window.location.origin}${line.slice(1)}`;
			}
			return line;
		})
		.join('url(');
}

/**
 * Convert feature props to a window features string.
 * @param obj - The feature props.
 * @returns The features string.
 */
function toWindowFeatures(obj: WindowFeatures): string {
	return Object.entries(obj)
		.map(([name, value]) =>
			typeof value === 'boolean' ? `${name}=${value ? 'yes' : 'no'}` : `${name}=${value}`
		)
		.join(',');
}

/**
 * Copy styles from a source document to a target document.
 * @param source - The source document.
 * @param target - The target document.
 */
function copyStyles(source: Document, target: Document): void {
	const headFrag = target.createDocumentFragment();

	Array.from(source.styleSheets).forEach((styleSheet) => {
		try {
			const rules = styleSheet.cssRules;
			if (rules) {
				const ruleText: string[] = [];
				Array.from(rules).forEach((cssRule) => {
					const { type } = cssRule;
					let returnText: string;

					if (type === CSSRule.KEYFRAMES_RULE) {
						returnText = getKeyFrameText(cssRule as CSSRuleType);
					} else if ([CSSRule.IMPORT_RULE, CSSRule.FONT_FACE_RULE].includes(type as 3 | 5)) {
						returnText = fixUrlForRule(cssRule);
					} else {
						returnText = cssRule.cssText;
					}

					ruleText.push(returnText);
				});

				const newStyleEl = target.createElement('style');
				newStyleEl.textContent = ruleText.join('\n');
				headFrag.appendChild(newStyleEl);
			} else if (styleSheet.href) {
				const newLinkEl = target.createElement('link');
				newLinkEl.rel = 'stylesheet';
				newLinkEl.href = styleSheet.href;
				headFrag.appendChild(newLinkEl);
			}
		} catch (err) {
			console.error(err);
		}
	});

	target.head.appendChild(headFrag);
}

/**
 * Replace styles in the target document with a fresh copy from the source document.
 * @param source - The source document.
 * @param target - The target document.
 */
function replaceStyles(source: Document, target: Document): void {
	const elements = target.head.getElementsByTagName('style');
	while (elements[0]) {
		elements[0].parentNode?.removeChild(elements[0]);
	}

	copyStyles(source, target);
}

/**
 * A React component to manage new browser windows.
 */
class NewWindow extends React.PureComponent<NewWindowProps> {
	static defaultProps: Partial<NewWindowProps> = {
		url: '',
		name: '',
		title: '',
		features: { width: '600px', height: '640px' },
		onBlock: (): void => {},
		onOpen: (): void => {},
		onUnload: (): void => {},
		center: 'parent',
		copyStyles: true,
		closeOnUnmount: true
	};

	private container: HTMLElement | null = null;

	private window: Window | null = null;

	private windowCheckerInterval: number | null = null;

	private released = false;

	override state = {
		mounted: false
	};

	override render(): ReactPortal | null {
		if (!this.state.mounted) return null;
		return ReactDOM.createPortal(this.props.children, this.container!);
	}

	override componentDidMount(): void {
		if (!this.window && !this.container) {
			this.openChild();
		}
	}

	override componentWillUnmount(): void {
		if (this.state.mounted && this.window) {
			if (this.props.closeOnUnmount) {
				this.window.close();
			} else if (this.props.children) {
				const clone = this.container!.cloneNode(true) as HTMLElement;
				clone.setAttribute('id', 'new-window-container-static');
				this.window.document.body.appendChild(clone);
			}
		}
	}

	private openChild(): void {
		const { url, title, name, features, onBlock, onOpen, center } = this.props;

		if (center === 'parent') {
			const width =
				typeof features!.width === 'number'
					? features!.width
					: parseInt(features!.width as string, 10);
			const height =
				typeof features!.height === 'number'
					? features!.height
					: parseInt(features!.height as string, 10);

			features!.left = window.top!.outerWidth / 2 + window.top!.screenX - width / 2;
			features!.top = window.top!.outerHeight / 2 + window.top!.screenY - height / 2;
		}
		this.window = window.open(url, name, toWindowFeatures(features!));

		this.windowCheckerInterval = window.setInterval(() => {
			if (!this.window || this.window.closed) {
				this.release();
				clearInterval(this.windowCheckerInterval!);
			}
		}, 50);

		if (this.window) {
			this.container = this.window.document.createElement('div');
			this.container.setAttribute('id', 'new-window-container');
			this.container.style.height = '100%';

			this.window.document.body.appendChild(this.container);

			if (this.props.copyStyles) {
				setTimeout(() => copyStyles(document, this.window!.document), 0);
			}

			if (onOpen) onOpen(this.window);

			this.window.addEventListener('beforeunload', this.release.bind(this));
			this.setState({ mounted: true });
		} else if (onBlock) {
			onBlock();
		}
	}

	private release(): void {
		if (this.released) return;
		this.released = true;

		clearInterval(this.windowCheckerInterval!);

		const { onUnload } = this.props;
		if (onUnload) onUnload();
	}
}

export default NewWindow;
export { copyStyles, replaceStyles };
