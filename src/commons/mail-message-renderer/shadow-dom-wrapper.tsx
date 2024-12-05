/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { useRef, useState, ReactNode, useEffect, useCallback } from 'react';

import { useUserSettings } from '@zextras/carbonio-shell-ui';
import { enable as enableDarkReader, exportGeneratedCSS } from 'darkreader';
import { find } from 'lodash';
import { createPortal } from 'react-dom';

type ShadowDomWrapperProps = {
	children: ReactNode;
};

export const ShadowDomWrapper = ({ children }: ShadowDomWrapperProps): React.JSX.Element => {
	const shadowRootRef = useRef<ShadowRoot | null>(null);
	const containerRef = useRef<HTMLDivElement>(null);
	const [shadowRootInitialized, setShadowRootInitialized] = useState(false);

	const getDarkReaderGeneratedCss = useCallback(() => {
		exportGeneratedCSS()
			.then((css) => {
				const styleSheet = new CSSStyleSheet();
				styleSheet.replaceSync(css);
				if (shadowRootRef.current) {
					shadowRootRef.current.adoptedStyleSheets = [styleSheet];
				}
			})
			.catch((error) => {
				console.error('Failed to apply Dark Reader styles:', error);
			});
	}, []);

	const { props } = useUserSettings();
	useEffect(() => {
		if (containerRef.current && !shadowRootRef.current) {
			shadowRootRef.current = containerRef.current.attachShadow({ mode: 'open' });
			const darkReaderMode = find(props, { name: 'zappDarkreaderMode' })?._content;
			if (darkReaderMode === 'enabled') {
				enableDarkReader({});
				getDarkReaderGeneratedCss();
			}
			setShadowRootInitialized(true);
		}
		return () => {
			if (shadowRootRef.current) {
				shadowRootRef.current.innerHTML = '';
			}
		};
	}, [props, getDarkReaderGeneratedCss]);

	return (
		<div ref={containerRef}>
			{shadowRootInitialized &&
				shadowRootRef.current &&
				createPortal(children, shadowRootRef.current)}
		</div>
	);
};
