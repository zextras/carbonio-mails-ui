/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { useMemo } from 'react';

import { Theme } from '@emotion/react';
import { getColor, Tooltip, Text, useTheme } from '@zextras/carbonio-design-system';
import { t } from '@zextras/carbonio-shell-ui';
import { capitalize } from 'lodash';

import { Participant, MailMessage } from 'types';

function getSpanStyle({
	theme,
	isRead,
	color
}: {
	theme: Theme;
	isRead?: string | boolean;
	color?: string;
}): { padding: string; color: string; fontWeight: number } {
	return {
		padding: '0 0.125rem',
		color:
			(color && getColor(color, theme)) ||
			(isRead && theme.palette.text.regular) ||
			theme.palette.primary.regular,
		fontWeight: isRead ? theme.fonts.weight.regular : theme.fonts.weight.bold
	};
}
export const OnBehalfOfDisplayer = ({
	compProps: { senderContact, mainContact, message }
}: {
	compProps: { senderContact: Participant; mainContact: Participant; message: MailMessage };
}): React.JSX.Element => {
	const theme = useTheme();
	const [mainContactFullName, mainContactAddress] = useMemo(
		() => [capitalize(mainContact.fullName || mainContact.name), mainContact.address],
		[mainContact]
	);
	const [fullName, address] = useMemo(
		() => [capitalize(senderContact.fullName), senderContact.address],
		[senderContact]
	);

	const behalfOfLabel = useMemo(() => t('label.behalf_of', 'behalf of'), []);

	const messageLabel = useMemo(
		(): React.JSX.Element => (
			<>
				<span style={getSpanStyle({ theme, isRead: message.read ?? '' })}>{fullName}</span>
				<span style={getSpanStyle({ theme, color: 'secondary', isRead: message.read })}>
					{` <${address}> `}
				</span>
				<span style={getSpanStyle({ theme, color: 'text' })}>{behalfOfLabel}</span>
				<span style={getSpanStyle({ theme, isRead: message.read })}>{mainContactFullName}</span>
				<span style={getSpanStyle({ theme, color: 'secondary', isRead: message.read })}>
					{` <${mainContactAddress}> `}
				</span>
			</>
		),
		[address, behalfOfLabel, fullName, mainContactAddress, mainContactFullName, message.read, theme]
	);

	return (
		<Tooltip label={messageLabel} overflowTooltip>
			<Text>{messageLabel}</Text>
		</Tooltip>
	);
};
