import unittest

from app.routers import resources


class ResourceRootsTest(unittest.TestCase):
    def test_new_mcm_archive_is_whitelisted(self):
        roots = {root["key"]: root for root in resources.RESOURCE_ROOTS}

        self.assertIn("mcm_full_archive", roots)
        archive = roots["mcm_full_archive"]
        self.assertEqual(archive["kind"], "综合资料")
        self.assertIn("历年美赛赛题、翻译、优秀论文", archive["title"])
        self.assertTrue(archive["path"].is_dir())

    def test_year_detection_ignores_team_numbers(self):
        path = (
            resources.PROJECT_ROOT
            / "历年美赛赛题、翻译、优秀论文（中英文）、赛题解析等"
            / "2006-2024年美赛O奖特等奖论文合集！"
            / "2022美赛O奖特等奖论文集【数学建模老哥】"
            / "E题O奖论文【公众号：数学建模老哥】"
            / "2202666【公众号：数学建模老哥】.pdf"
        )

        self.assertEqual(resources._year_from_path(path), "2022")

    def test_download_access_code_is_required_when_configured(self):
        original = resources.settings.trial_access_code
        try:
            resources.settings.trial_access_code = "bridge-demo"

            with self.assertRaises(resources.HTTPException) as ctx:
                resources._require_trial_access("wrong")

            self.assertEqual(ctx.exception.status_code, 403)
            resources._require_trial_access("bridge-demo")
        finally:
            resources.settings.trial_access_code = original

    def test_download_access_code_is_optional_when_not_configured(self):
        original = resources.settings.trial_access_code
        try:
            resources.settings.trial_access_code = ""
            resources._require_trial_access("")
        finally:
            resources.settings.trial_access_code = original


if __name__ == "__main__":
    unittest.main()
