/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { useMemo } from 'react';

import { includes, map } from 'lodash';
import { useTranslation } from 'react-i18next';

import { msgActionSoapApi } from '../../api/msg-action';
import { useTags } from '../../carbonio-ui-commons/store/zustand/tags';
import { MessageActionsDescriptors, TIMEOUTS } from '../../constants';
import { isSpam } from '../../helpers/folders';
import { UIActionAggregator, UIActionDescriptor } from '../../types';
import { useUiUtilities } from '../use-ui-utilities';

export const useMsgApplyTagSubDescriptors = ({
	ids,
	messageTags,
	folderId
}: {
	ids: Array<string>;
	messageTags: Array<string>;
	folderId: string;
}): UIActionDescriptor[] => {
	const { createSnackbar } = useUiUtilities();
	const [t] = useTranslation();
	const tags = useTags();

	const tagActions = useMemo(
		() =>
			map(tags, (tag) => {
				const isTagIncluded = includes(messageTags, tag.id);
				const operation = isTagIncluded ? '!tag' : 'tag';
				const icon = isTagIncluded ? 'TagOutline' : 'Tag';
				const snackbarSuccessLabel = isTagIncluded
					? t('snackbar.tag_removed', {
							tag: tag.name,
							defaultValue: '"{{tag}}" tag removed'
						})
					: t('snackbar.tag_applied', {
							tag: tag.name,
							defaultValue: '"{{tag}}" tag applied'
						});

				const canExecute = (): boolean => !isSpam(folderId);

				const execute = (): void => {
					if (canExecute()) {
						msgActionSoapApi({ operation, ids, tagName: tag.name }).then((res: any) => {
							if (!('Fault' in res)) {
								createSnackbar({
									key: `tag`,
									replace: true,
									hideButton: true,
									severity: 'info',
									label: snackbarSuccessLabel,
									autoHideTimeout: TIMEOUTS.SNACKBAR_DEFAULT_TIMEOUT
								});
							} else {
								createSnackbar({
									key: `tag`,
									replace: true,
									severity: 'error',
									label: t('label.error_try_again', 'Something went wrong, please try again'),
									autoHideTimeout: TIMEOUTS.SNACKBAR_DEFAULT_TIMEOUT,
									hideButton: true
								});
							}
						});
					}
				};
				return {
					id: tag.id,
					icon,
					label: tag.name,
					color: tag.color,
					execute,
					canExecute
				};
			}),
		[createSnackbar, folderId, ids, messageTags, t, tags]
	);

	return useMemo(() => tagActions, [tagActions]);
};

export const useMsgApplyTagDescriptor = ({
	ids,
	messageTags,
	folderId
}: {
	ids: Array<string>;
	messageTags: Array<string>;
	folderId: string;
}): UIActionAggregator => {
	const [t] = useTranslation();
	const items = useMsgApplyTagSubDescriptors({
		ids,
		messageTags,
		folderId
	});
	return {
		id: MessageActionsDescriptors.APPLY_TAG.id,
		label: t('label.tag', 'Tag'),
		icon: 'TagsMoreOutline',
		items
	};
};
