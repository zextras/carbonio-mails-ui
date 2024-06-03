/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { useMemo } from 'react';

import { Container, Icon, Padding, Text } from '@zextras/carbonio-design-system';
import { t } from '@zextras/carbonio-shell-ui';
import styled from 'styled-components';

const SearchIcon = styled(Icon)`
	width: 3.3rem;
	height: 3.3rem;
`;

export const BackupSearchPanel = ({
	itemId
}: {
	itemId: string | undefined;
}): React.JSX.Element => {
	const displayerTitle = useMemo(() => itemId, [itemId]);
	const restoreEmailsTitle = t(
		'label.displayer_restore_emails_title',
		'Select the e-mails you want to restore'
	);
	const restoreEmailsDescription = t(
		'label.displayer_restore_emails_description',
		'Once the selected email recovery is complete, \n you will receive an email with information regarding the results.'
	);
	return itemId ? (
		<Container background="gray5">
			<Padding all="medium">
				<Text
					color="gray1"
					overflow="break-word"
					weight="bold"
					size="large"
					style={{ whiteSpace: 'pre-line', textAlign: 'center' }}
				>
					{displayerTitle}
				</Text>
			</Padding>
		</Container>
	) : (
		<Container background="gray5">
			<SearchIcon icon="Search" color="gray1" />
			<Padding all="medium">
				<Text
					color="gray1"
					overflow="break-word"
					weight="bold"
					size="extralarge"
					style={{ whiteSpace: 'pre-line', textAlign: 'center' }}
				>
					{restoreEmailsTitle}
				</Text>
			</Padding>
			<Text
				size="small"
				color="gray1"
				overflow="break-word"
				style={{ whiteSpace: 'pre-line', textAlign: 'center' }}
			>
				{restoreEmailsDescription}
			</Text>
		</Container>
	);
};
