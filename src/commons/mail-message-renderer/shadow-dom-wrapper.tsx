/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { useRef, useState, ReactNode, useEffect } from 'react';

import { createPortal } from 'react-dom';

type ShadowDomWrapperProps = {
	children: ReactNode;
};

export const ShadowDomWrapper = ({ children }: ShadowDomWrapperProps): React.JSX.Element => {
	const shadowRootRef = useRef<ShadowRoot | null>(null);
	const containerRef = useRef<HTMLDivElement>(null);
	const [shadowRootInitialized, setShadowRootInitialized] = useState(false);

	useEffect(() => {
		if (containerRef.current && !shadowRootRef.current) {
			shadowRootRef.current = containerRef.current.attachShadow({ mode: 'closed' });
			setShadowRootInitialized(true);
		}
		return () => {
			if (shadowRootRef.current) {
				shadowRootRef.current.innerHTML = '';
			}
		};
	}, []);

	return (
		<div ref={containerRef}>
			{shadowRootInitialized &&
				shadowRootRef.current &&
				createPortal(children, shadowRootRef.current)}
		</div>
	);
};
