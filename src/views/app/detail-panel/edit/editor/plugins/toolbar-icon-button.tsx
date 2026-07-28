/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { Button, type IconProps, Tooltip } from '@zextras/carbonio-design-system';

export type ToolbarIconButtonProps = {
	icon: IconProps['icon'];
	label: string;
	onClick: () => void;
	/**
	 * For toggle controls, whether the option is active for the current selection.
	 * When set, the button is highlighted and exposes `aria-pressed`; leave it
	 * undefined for plain action buttons.
	 */
	active?: boolean;
};

export const ToolbarIconButton = ({
	icon,
	label,
	onClick,
	active
}: ToolbarIconButtonProps): React.JSX.Element => (
	<Tooltip label={label}>
		{active ? (
			<Button
				icon={icon}
				type="default"
				size="extralarge"
				onClick={onClick}
				aria-label={label}
				aria-pressed
				backgroundColor="highlight"
				labelColor="text"
			/>
		) : (
			<Button
				icon={icon}
				type="ghost"
				size="extralarge"
				onClick={onClick}
				aria-label={label}
				aria-pressed={active === undefined ? undefined : false}
				color="text"
			/>
		)}
	</Tooltip>
);
