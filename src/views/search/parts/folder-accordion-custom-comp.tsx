/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { FC, useMemo } from 'react';
import { FOLDERS, useUserAccount, useUserSettings } from '@zextras/carbonio-shell-ui';
import { AccordionItem, Tooltip, Row, Padding } from '@zextras/carbonio-design-system';
import {
	getFolderIconColor,
	getFolderIconName,
	getFolderTranslatedName
} from '../../sidebar/utils';

// TODO remove the any type after the Accordion refactor in the DS
const AccordionCustomComponent: FC<{ item: any }> = ({ item }) => {
	const { folder } = item;
	const accountName = useUserAccount().name;

	const accordionItem = useMemo(
		() => ({
			...item,
			label:
				item.id === FOLDERS.USER_ROOT
					? accountName
					: getFolderTranslatedName({ folderId: item.id, folderName: item.label }),
			icon: getFolderIconName(item),
			iconColor: getFolderIconColor(item),
			textProps: { size: 'small' }
		}),
		[item, accountName]
	);
	const settings = useUserSettings()?.prefs;
	const [includeSpam, includeTrash, includeSharedFolders] = useMemo(
		() => [
			settings?.zimbraPrefIncludeSpamInSearch === 'TRUE',
			settings?.zimbraPrefIncludeTrashInSearch === 'TRUE',
			settings?.zimbraPrefIncludeSharedItemsInSearch === 'TRUE'
		],
		[settings]
	);

	const hasToExclude = useMemo(
		() =>
			(!includeTrash && folder.name === 'Trash') ||
			(!includeSpam && folder.name === 'Junk') ||
			(!includeSharedFolders && folder.isLink),
		[folder.isLink, folder.name, includeSharedFolders, includeSpam, includeTrash]
	);

	if (hasToExclude) return <></>;
	return (
		<Row>
			<Padding left="small" />
			<Tooltip label={accordionItem.label} placement="right" maxWidth="100%">
				<AccordionItem item={accordionItem} />
			</Tooltip>
		</Row>
	);
};

export default AccordionCustomComponent;
