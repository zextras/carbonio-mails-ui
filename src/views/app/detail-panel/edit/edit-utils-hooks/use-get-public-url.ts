/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { useCallback } from 'react';

import { t, useIntegratedFunction } from '@zextras/carbonio-shell-ui';
import { filter, map } from 'lodash';

import { useUiUtilities } from '../../../../../hooks/use-ui-utilities';

type UseGetPublicUrlPropType = {
	addPublicLinkFromFiles: (filesResponse: UseGetPublicUrlRespType[]) => void;
};

export type UseGetPublicUrlRespType = {
	status: string;
	value: {
		__typename?: 'Link';
		id: string;
		url?: string | null;
		description?: string | null;
		expires_at?: number | null;
		created_at: number;
		node: {
			__typename?: string;
			id: string;
		};
	};
};

export const useGetPublicUrl = ({
	addPublicLinkFromFiles
}: UseGetPublicUrlPropType): [(nodes: any) => void, boolean] => {
	const { createSnackbar } = useUiUtilities();
	const [getLink, getLinkAvailable] = useIntegratedFunction('get-link');

	const getPublicUrl = useCallback(
		(nodes) => {
			const promises = map(nodes, (node) =>
				getLink({ node, type: 'createLink', description: node.id })
			);

			Promise.allSettled(promises).then((res) => {
				const success = filter(res, ['status', 'fulfilled']);
				const allSuccess = res.length === success?.length;
				const allFails = res.length === filter(res, ['status', 'rejected'])?.length;
				// eslint-disable-next-line no-nested-ternary
				const label = allSuccess
					? t('message.snackbar.all_link_copied', 'Public link copied successfully')
					: allFails
						? t(
								'message.snackbar.link_copying_error',
								'There seems to be a problem while generating public link, please try again'
							)
						: t(
								'message.snackbar.some_link_copying_error',
								'There seems to be a problem while generating public url for some files, please try again'
							);
				createSnackbar({
					key: `public-link`,
					replace: true,
					severity: allSuccess ? 'info' : 'warning',
					hideButton: true,
					label,
					autoHideTimeout: 4000
				});
				addPublicLinkFromFiles(success as UseGetPublicUrlRespType[]);
			});
		},
		[addPublicLinkFromFiles, createSnackbar, getLink]
	);
	return [getPublicUrl, getLinkAvailable];
};
