/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, ReactElement, useMemo } from 'react';

import { TextWithTooltip } from '@zextras/carbonio-design-system';
import { t } from '@zextras/carbonio-shell-ui';
import { capitalize } from 'lodash';
import styled from 'styled-components';
import { Participant, MailMessage } from '../../../../../types';

const StyledText = styled.span<{ isRead?: string | boolean; color?: string }>`
	padding: 0 0.125rem;
	color: ${({ theme, color, isRead }): string =>
		// eslint-disable-next-line no-nested-ternary
		color
			? theme.palette[color].regular
			: isRead
			? theme.palette.text.regular
			: theme.palette.primary.regular};

	font-weight: ${({ theme, isRead }): string =>
		isRead ? theme.fonts.weight.regular : theme.fonts.weight.bold};
`;
const OnBehalfOfDisplayer: FC<{
	compProps: { senderContact: Participant; mainContact: Participant; message: MailMessage };
}> = ({ compProps: { senderContact, mainContact, message } }): ReactElement => {
	const [mainContactFullName, mainContactAddress] = useMemo(
		() => [capitalize(mainContact.fullName || mainContact.name), mainContact.address],
		[mainContact]
	);
	const [fullName, address] = useMemo(
		() => [capitalize(senderContact.fullName), senderContact.address],
		[senderContact]
	);

	const behalfOfLabel = useMemo(() => t('label.behalf_of', 'behalf of'), []);
	return (
		<TextWithTooltip>
			<StyledText isRead={message.read ?? ''}>{fullName}</StyledText>
			<StyledText color="secondary" isRead={message.read}>
				{` <${address}> `}
			</StyledText>
			<StyledText color="text">{behalfOfLabel}</StyledText>
			<StyledText isRead={message.read}>{mainContactFullName}</StyledText>
			<StyledText color="secondary" isRead={message.read}>
				{` <${mainContactAddress}> `}
			</StyledText>
		</TextWithTooltip>
	);
};

export default OnBehalfOfDisplayer;
