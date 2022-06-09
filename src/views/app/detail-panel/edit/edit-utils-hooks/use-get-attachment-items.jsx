/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Icon, Padding, Text } from '@zextras/carbonio-design-system';
import { getAction } from '@zextras/carbonio-shell-ui';
import { compact } from 'lodash';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useGetPublicUrl } from './use-get-public-url';
import { useGetFilesFromDrive } from './use-get-drive-files';

export const useGetAttachItems = ({
	onFileClick,
	setOpenDD,
	editorId,
	updateEditorCb,
	saveDraftCb,
	setValue
}) => {
	const [t] = useTranslation();
	const [getFilesFromDrive, getFilesAvailable] = useGetFilesFromDrive({
		editorId,
		updateEditorCb,
		saveDraftCb
	});
	const [getLink, getLinkAvailable] = useGetPublicUrl({
		editorId,
		updateEditorCb,
		saveDraftCb,
		setValue
	});

	const actionTarget = useMemo(
		() => ({
			confirmAction: getFilesFromDrive,
			confirmLabel: t('label.select', 'Select'),
			allowFiles: true,
			allowFolders: false
		}),
		[getFilesFromDrive, t]
	);

	const actionURLTarget = useMemo(
		() => ({
			confirmAction: getLink,
			confirmLabel: t('label.share_public_link', 'Share Public Link'),
			allowFiles: true,
			allowFolders: false
		}),
		[getLink, t]
	);
	const [filesSelectFilesAction, filesSelectFilesActionAvailable] = getAction(
		'carbonio_files_action',
		'files-select-nodes',
		actionTarget
	);
	const [getFilesAction, getFilesActionAvailable] = getAction(
		'carbonio_files_action',
		'files-select-nodes',
		actionURLTarget
	);

	return useMemo(() => {
		const localItem = {
			id: 'localAttachment',
			icon: 'MonitorOutline',
			label: t('composer.attachment.local', 'Add from local'),
			click: onFileClick,
			customComponent: (
				<>
					<Icon icon="MonitorOutline" size="medium" />
					<Padding horizontal="extrasmall" />
					<Text>{t('composer.attachment.local', 'Add from local')}</Text>
				</>
			)
		};
		const contactItem = {
			id: 'contactsModAttachment',
			icon: 'ContactsModOutline',
			label: t('composer.attachment.contacts_mod', 'Add Contact Card'),
			click: () => {
				setOpenDD(false);
			},
			disabled: true
		};
		const driveItem =
			filesSelectFilesActionAvailable && getFilesAvailable
				? {
						...filesSelectFilesAction,
						label: t('composer.attachment.files', 'Add from Files')
				  }
				: undefined;
		const fileUrl =
			getFilesActionAvailable && getLinkAvailable
				? {
						...getFilesAction,
						label: t('composer.attachment.url', 'Add public link from Files'),
						icon: 'Link2'
				  }
				: undefined;

		return compact([localItem, driveItem, fileUrl, contactItem]);
	}, [
		t,
		onFileClick,
		filesSelectFilesActionAvailable,
		getFilesAvailable,
		filesSelectFilesAction,
		getFilesActionAvailable,
		getLinkAvailable,
		getFilesAction,
		setOpenDD
	]);
};
