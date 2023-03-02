/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Icon, Padding, Text } from '@zextras/carbonio-design-system';
import { getIntegratedFunction, t } from '@zextras/carbonio-shell-ui';
import { compact } from 'lodash';
import React, { ReactElement, useMemo } from 'react';
import { useGetPublicUrl } from './use-get-public-url';
import { useGetFilesFromDrive } from './use-get-drive-files';
import { MailsEditor } from '../../../../../types';

type UseGetAttachItemsPropType = {
	onFileClick: ((ev: React.SyntheticEvent<HTMLElement, Event> | KeyboardEvent) => void) | undefined;
	setOpenDD: (arg: boolean) => void;
	editorId: string;
	updateEditorCb: (arg: Partial<MailsEditor>) => void;
	saveDraftCb: (arg: Partial<MailsEditor>) => void;
	setValue: (arg1: string, arg2: string) => void;
};
type UseGetAttachItemsReturnType = {
	customComponent?: ReactElement;
	label: string;
	id?: string | undefined;
	icon?: string | undefined;
	click?: ((ev: React.SyntheticEvent<HTMLElement, Event> | KeyboardEvent) => void) | undefined;
	type?: string | undefined;
	primary?: boolean | undefined;
	group?: string | undefined;
	disabled?: boolean | undefined;
};
export const useGetAttachItems = ({
	onFileClick,
	setOpenDD,
	editorId,
	updateEditorCb,
	saveDraftCb,
	setValue
}: UseGetAttachItemsPropType): Array<UseGetAttachItemsReturnType> => {
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
			title: t('label.choose_file', 'Choose file'),
			confirmAction: getFilesFromDrive,
			confirmLabel: t('label.select', 'Select'),
			allowFiles: true,
			allowFolders: false
		}),
		[getFilesFromDrive]
	);

	const actionURLTarget = useMemo(
		() => ({
			title: t('label.choose_file', 'Choose file'),
			confirmAction: getLink,
			confirmLabel: t('label.share_public_link', 'Share Public Link'),
			allowFiles: true,
			allowFolders: false
		}),
		[getLink]
	);
	const [getFilesAction, getFilesActionAvailable] = getIntegratedFunction('select-nodes');

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
			click: (): void => {
				setOpenDD(false);
			},
			disabled: true
		};
		const driveItem =
			getFilesActionAvailable && getFilesAvailable
				? {
						label: t('composer.attachment.files', 'Add from Files'),
						icon: 'DriveOutline',
						click: (): void => {
							getFilesAction(actionTarget);
						}
				  }
				: undefined;
		const fileUrl =
			getFilesActionAvailable && getLinkAvailable
				? {
						label: t('composer.attachment.url', 'Add public link from Files'),
						icon: 'Link2',
						click: (): void => {
							getFilesAction(actionURLTarget);
						}
				  }
				: undefined;

		return compact([localItem, driveItem, fileUrl, contactItem]);
	}, [
		onFileClick,
		getFilesAvailable,
		actionTarget,
		getFilesActionAvailable,
		getLinkAvailable,
		getFilesAction,
		actionURLTarget,
		setOpenDD
	]);
};
