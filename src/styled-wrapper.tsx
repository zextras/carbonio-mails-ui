/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { ReactNode } from 'react';

import { ThemeProvider } from '@zextras/carbonio-design-system';
import type { Theme as DSTheme } from '@zextras/carbonio-design-system';
import { createGlobalStyle, DefaultTheme } from 'styled-components';

import { AnimatedLoader } from './assets/animated-loader';

const themeOverride = (theme: DSTheme): DefaultTheme => ({
	...theme,
	icons: {
		...theme.icons,
		AnimatedLoader
	} as DefaultTheme['icons'] // FIXME check how to remove this cast
});

const GlobalStyle = createGlobalStyle`
  .disable-hover, .disable-hover * {
	  &:hover {
		  background-color: transparent;
	  }
  }
`;

const StyledWrapper: React.FC<{
	children: React.ReactNode;
}> = ({ children }) => (
	<ThemeProvider loadDefaultFont={false} extension={themeOverride}>
		<GlobalStyle />
		{children}
	</ThemeProvider>
);

export default StyledWrapper;
