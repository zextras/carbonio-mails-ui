/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { useMemo } from 'react';

import { AccordionItem, Avatar, Padding, Row, Tooltip } from '@zextras/carbonio-design-system';
import { useUserAccount } from '@zextras/carbonio-shell-ui';
import styled from 'styled-components';

import { ROOT_NAME } from '../../../carbonio-ui-commons/constants';
import { FOLDERS } from '../../../carbonio-ui-commons/constants/folders';
import { Folder } from '../../../types';
import { getFolderTranslatedName, getFolderIconName, getFolderIconColor } from '../utils';
import { StatusIcon } from './status-icon';

const FittedRow = styled(Row)`
	max-width: calc(100% - (2 * ${({ theme }): string => theme.sizes.padding.small}));
	height: 3rem;
`;

export const FolderAccordionCustomComponent = ({
	folder
}: {
	folder: Folder;
}): React.JSX.Element => {
	const accountName = useUserAccount().name;

	const textProps: { size: 'small' } = useMemo(
		() => ({
			size: 'small'
		}),
		[]
	);
	const accordionItem = useMemo(
		() => ({
			...folder,
			label:
				folder.id === FOLDERS.USER_ROOT
					? accountName
					: (getFolderTranslatedName({ folderId: folder.id, folderName: folder.name }) ?? ''),
			icon: getFolderIconName(folder) ?? undefined,
			iconColor: getFolderIconColor(folder) ?? '',
			textProps
		}),
		[folder, accountName, textProps]
	);

	// hide folders where a share was provided and subsequently removed
	if (folder.isLink && folder.broken) {
		return <></>;
	}

	const showAvatar =
		folder.id === FOLDERS.USER_ROOT || (folder.isLink && folder.oname === ROOT_NAME);

	return (
		<FittedRow>
			{showAvatar && (
				<Padding left="small">
					<Avatar label={accordionItem.label} colorLabel={accordionItem.iconColor} size="medium" />
				</Padding>
			)}
			<Tooltip label={accordionItem.label} placement="right" maxWidth="100%">
				<AccordionItem data-testid={`accordion-folder-item-${folder.id}`} item={accordionItem}>
					<StatusIcon folder={folder} />
				</AccordionItem>
			</Tooltip>
		</FittedRow>
	);
};
