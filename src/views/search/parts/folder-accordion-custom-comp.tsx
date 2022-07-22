/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { FC, useMemo } from 'react';
import {
	FOLDERS,
	useUserAccount,
	AccordionFolder,
	useUserSettings
} from '@zextras/carbonio-shell-ui';
import { AccordionItem, Tooltip, Row, Padding } from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';

import {
	getFolderIconColor,
	getFolderIconName,
	getFolderTranslatedName
} from '../../sidebar/utils';

const AccordionCustomComponent: FC<{ item: AccordionFolder }> = ({ item }) => {
	const { folder } = item;
	const accountName = useUserAccount().name;
	const [t] = useTranslation();

	const accordionItem = useMemo(
		() => ({
			...item,
			label:
				item.id === FOLDERS.USER_ROOT
					? accountName
					: getFolderTranslatedName({ t, folderId: item.id, folderName: item.label }),
			icon: getFolderIconName(item),
			iconColor: getFolderIconColor(item),
			textProps: { size: 'small' }
		}),
		[item, accountName, t]
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
