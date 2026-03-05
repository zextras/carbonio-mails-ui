/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { useMemo } from 'react';

import styled from '@emotion/styled';
import { AccordionItem, Avatar, Padding, Row, Tooltip } from '@zextras/carbonio-design-system';
import { useUserAccount } from '@zextras/carbonio-shell-ui';
import { Folder, FOLDERS, ROOT_NAME } from '@zextras/carbonio-ui-commons';

import { StatusIcon } from 'views/sidebar/commons/status-icon';
import {
	getFolderIconColor,
	getFolderIconName,
	getFolderTranslatedName
} from 'views/sidebar/utils';

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
