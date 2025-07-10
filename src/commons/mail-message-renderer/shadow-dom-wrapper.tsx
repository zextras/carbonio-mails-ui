/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { ReactNode, useCallback, useEffect, useRef, useState } from 'react';

import { useUserSettings } from '@zextras/carbonio-shell-ui';
import { enable as enableDarkReader } from 'darkreader';
import { createPortal } from 'react-dom';

type ShadowDomWrapperProps = {
	children: ReactNode;
};

export const ShadowDomWrapper = ({ children }: ShadowDomWrapperProps): React.JSX.Element => {
	const shadowRootRef = useRef<ShadowRoot | null>(null);
	const containerRef = useRef<HTMLDivElement>(null);
	const [shadowRootInitialized, setShadowRootInitialized] = useState(false);

	const styleSheetSet = useCallback(async (shadowRoot: ShadowRoot) => {
		const stylesToCopy = document.querySelectorAll('head style.darkreader');
		stylesToCopy.forEach((st) => {
			const style = document.createElement('style');
			style.className = 'darkreader darkreader--inline';
			style.textContent = st?.textContent;
			shadowRoot.appendChild(style);
		});
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
		if (containerRef.current) {
			if (!containerRef.current.shadowRoot) {
				shadowRootRef.current = containerRef.current.attachShadow({ mode: 'open' });
				setShadowRootInitialized(true);
			} else {
				shadowRootRef.current = containerRef.current.shadowRoot;
			}
			if (darkModeEnabled()) {
				enableDarkReader({});
			}
			if (shadowRootRef.current && darkModeEnabled()) {
				styleSheetSet(shadowRootRef.current);
			}
		}

		return () => {
			if (shadowRootRef.current) {
				shadowRootRef.current = null;
			}
		};
	}, [darkModeEnabled, styleSheetSet]);

	return (
		<div ref={containerRef} data-testid="shadow-dom-wrapper">
			{shadowRootInitialized &&
				shadowRootRef.current &&
				createPortal(children, shadowRootRef.current)}
		</div>
	);
};
