/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { ReactNode, useCallback, useEffect, useRef, useState } from 'react';

import { useUserSettings } from '@zextras/carbonio-shell-ui';
import { enable as enableDarkReader, exportGeneratedCSS } from 'darkreader';
import { createPortal } from 'react-dom';

type ShadowDomWrapperProps = {
	children: ReactNode;
};

export const ShadowDomWrapper = ({ children }: ShadowDomWrapperProps): React.JSX.Element => {
	const shadowRootRef = useRef<ShadowRoot | null>(null);
	const containerRef = useRef<HTMLDivElement>(null);
	const [shadowRootInitialized, setShadowRootInitialized] = useState(false);
	const darkReaderAppliedRef = useRef(false);

	const applyDarkReaderStyles = useCallback(async () => {
		if (!darkReaderAppliedRef.current) {
			try {
				const generatedCSS = await exportGeneratedCSS();
				const styleSheet = new CSSStyleSheet();
				styleSheet.replaceSync(generatedCSS);

				if (shadowRootRef.current) {
					shadowRootRef.current.adoptedStyleSheets = [styleSheet];
					darkReaderAppliedRef.current = true;
				}
			} catch (error) {
				/* empty */
			}
		}
	}, []);

	const {
		prefs: { carbonioPrefDarkMode }
	} = useUserSettings();

	const darkModeEnabled = useCallback(
		() =>
			carbonioPrefDarkMode === 'enabled' ||
			(carbonioPrefDarkMode === 'auto' &&
				window.matchMedia &&
				window.matchMedia('(prefers-color-scheme: dark)').matches),
		[carbonioPrefDarkMode]
	);

	useEffect(() => {
		if (containerRef.current && !shadowRootRef.current) {
			shadowRootRef.current = containerRef.current.attachShadow({ mode: 'open' });

			if (darkModeEnabled()) {
				enableDarkReader({});
				applyDarkReaderStyles();
			}

			setShadowRootInitialized(true);
		}

		return () => {
			if (shadowRootRef.current) {
				shadowRootRef.current.innerHTML = '';
				darkReaderAppliedRef.current = false;
			}
		};
	}, [applyDarkReaderStyles, darkModeEnabled]);

	return (
		<div ref={containerRef} data-testid="shadow-dom-wrapper">
			{shadowRootInitialized &&
				shadowRootRef.current &&
				createPortal(children, shadowRootRef.current)}
		</div>
	);
};
