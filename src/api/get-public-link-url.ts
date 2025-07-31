/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import axios from 'axios';

type FilesCreateLinkResponse = {
	data: { createLink: { id: string; url: string } };
};

export async function getPublicLinkUrl(nodeId: string): Promise<string> {
	const headers = {
		'Content-Type': 'application/json',
		Pragma: 'no-cache'
	};
	try {
		const response = await axios.post<FilesCreateLinkResponse>(
			'/services/files/graphql',
			{
				operationName: 'createLink',
				variables: {
					node_id: nodeId
				},
				query: `
				mutation createLink($node_id: ID!, $description: String, $expires_at: DateTime, $access_code: String) {
					createLink(
						node_id: $node_id,
						description: $description,
						expires_at: $expires_at,
						access_code: $access_code
					) {
						...Link
						__typename
					}
				}

				fragment Link on Link {
					id
					url
					description
					access_code
					expires_at
					created_at
					node {
						id
						__typename
					}
					__typename
				}
			`
			},
			{
				headers
			}
		);
		if (response.data.data) {
			return response.data.data.createLink.url;
		}
		throw new Error('createLink successful but no url returned');
	} catch (error) {
		throw new Error(`createLink failed: ${error instanceof Error ? error.message : String(error)}`);
	}
}
