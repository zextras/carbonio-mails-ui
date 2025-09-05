/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { SVGProps } from 'react';

import { Global, css } from '@emotion/react';
import { Theme, ThemeProvider } from '@zextras/carbonio-design-system';

import { AnimatedLoader } from 'assets/animated-loader';

type IconComponent = (props: SVGProps<SVGSVGElement>) => React.JSX.Element;

const createDottedIcon =
	(BaseIcon: IconComponent): IconComponent =>
	// eslint-disable-next-line react/display-name
	(props) => {
		const iconProps = { ...props };
		// @ts-expect-error remove data-testid from props for better testing
		delete iconProps['data-testid'];
		return (
			<svg {...props}>
				<BaseIcon {...iconProps} />
				<circle cx={'19'} cy={'5'} r={'4'} fill={'#2B73D2'} stroke={'#f5f6f8'} strokeWidth={'1'} />
			</svg>
		);
	};

const themeOverride = (theme: Theme): Theme => {
	const outlineIconsWithNotificationDot = Object.entries(theme.icons).reduce(
		(acc, [name, Icon]) => {
			if (name.endsWith('Outline')) {
				return { ...acc, [`${name}WithDot`]: createDottedIcon(Icon) };
			}
			return acc;
		},
		{} as Record<string, IconComponent>
	);

	return {
		...theme,
		icons: {
			...theme.icons,
			...outlineIconsWithNotificationDot,
			AnimatedLoader
		}
	};
};

const styles = css`
	.disable-hover,
	.disable-hover * {
		&:hover {
			background-color: transparent;
		}
	}
`;

const StyledWrapper: React.FC<{
	children: React.ReactNode;
}> = ({ children }) => (
	<ThemeProvider loadDefaultFont={false} extension={themeOverride}>
		<Global styles={styles} />
		{children}
	</ThemeProvider>
);

export default StyledWrapper;
