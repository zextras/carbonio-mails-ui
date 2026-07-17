/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { type SVGProps } from 'react';

import { EDITOR_ICON_CONTENTS, EditorIconName } from './editor-icon-contents';

/**
 * A custom icon component compatible with the Carbonio Design System `Icon`
 * (and therefore the `icon` prop of `Button`, `Icon`, ...): a function that
 * renders an `<svg>` and forwards the props injected by the design system
 * (color via `fill: currentColor`, sizing, `data-testid`, ...).
 */
export type EditorIconComponent = ((props: SVGProps<SVGSVGElement>) => React.JSX.Element) & {
	displayName?: string;
};

const componentCache = new Map<EditorIconName, EditorIconComponent>();

/**
 * Returns a memoized CDS-compatible icon component for a EDITOR icon name.
 *
 * The EDITOR glyphs carry no explicit `fill`, so they inherit the
 * `fill: currentColor` applied by the design system `Icon` wrapper and adopt
 * the surrounding text/button color. A `viewBox` is added because the source
 * SVGs only declared `width`/`height`, which would otherwise prevent scaling.
 */
export const editorIcon = (name: EditorIconName): EditorIconComponent => {
	const cached = componentCache.get(name);
	if (cached) {
		return cached;
	}
	const content = EDITOR_ICON_CONTENTS[name];
	const Component: EditorIconComponent = (props) => (
		// eslint-disable-next-line react/no-danger
		<svg viewBox="0 0 24 24" {...props} dangerouslySetInnerHTML={{ __html: content }} />
	);
	Component.displayName = `EditorIcon(${name})`;
	componentCache.set(name, Component);
	return Component;
};
