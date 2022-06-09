/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { SnackbarManagerContext } from '@zextras/carbonio-design-system';
import { useIntegratedFunction } from '@zextras/carbonio-shell-ui';
import { filter, map } from 'lodash';
import { useCallback, useContext, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { selectEditors } from '../../../../../store/editor-slice';

export const uploadToFiles = async (node, uploadTo) =>
	uploadTo({ nodeId: node.id, targetModule: 'MAILS' });

export const useGetFilesFromDrive = ({ editorId, updateEditorCb, saveDraftCb }) => {
	const createSnackbar = useContext(SnackbarManagerContext);
	const editors = useSelector(selectEditors);
	const editor = useMemo(() => editors[editorId], [editors, editorId]);
	const [t] = useTranslation();
	const [uploadTo, isAvailable] = useIntegratedFunction('upload-to-target-and-get-target-id');

	const confirmAction = useCallback(
		(nodes) => {
			const promises = map(nodes, (node) => uploadToFiles(node, uploadTo));
			if (isAvailable) {
				Promise.allSettled(promises).then((res) => {
					const success = filter(res, ['status', 'fulfilled']);
					const allSuccess = res.length === success?.length;
					const allFails = res.length === filter(res, ['status', 'rejected'])?.length;
					const type = allSuccess ? 'info' : 'warning';
					// eslint-disable-next-line no-nested-ternary
					const label = allSuccess
						? t('message.snackbar.all_att_added', 'Attachments added successfully')
						: allFails
						? t(
								'message.snackbar.att_err_adding',
								'There seems to be a problem when adding attachments, please try again'
						  )
						: t(
								'message.snackbar.some_att_add_fails',
								'There seems to be a problem when adding some attachments, please try again'
						  );
					createSnackbar({
						key: `calendar-moved-root`,
						replace: true,
						type,
						hideButton: true,
						label,
						autoHideTimeout: 4000
					});
					const data = {
						attach: { ...editor.attach, aid: map(success, (i) => i.value.attachmentId).join(',') }
					};
					const newEditor = { ...editor, ...data };
					updateEditorCb(newEditor);
					saveDraftCb(newEditor);
				});
			}
		},
		[createSnackbar, editor, isAvailable, saveDraftCb, t, updateEditorCb, uploadTo]
	);

	return [confirmAction, isAvailable];
};
