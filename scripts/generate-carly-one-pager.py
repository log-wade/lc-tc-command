#!/usr/bin/env python3
"""Generate Carly Bryant LC/TC Command one-pager PDF."""

from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import (
    HRFlowable,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "content" / "onboarding" / "carly-lc-tc-command-one-pager.pdf"

BRAND_TEXT = colors.HexColor("#4A4745")
BRAND_MUTED = colors.HexColor("#6B6764")
BRAND_CORAL = colors.HexColor("#F05D5E")
BRAND_TEAL = colors.HexColor("#4FB6B2")
BRAND_BG = colors.HexColor("#FAF7F0")
BRAND_BORDER = colors.HexColor("#DCD6CC")
TEAL = "#4FB6B2"


def build_styles():
    base = getSampleStyleSheet()
    return {
        "title": ParagraphStyle(
            "title",
            parent=base["Heading1"],
            fontName="Helvetica-Bold",
            fontSize=15,
            leading=17,
            textColor=BRAND_TEXT,
        ),
        "subtitle": ParagraphStyle(
            "subtitle",
            parent=base["Normal"],
            fontName="Helvetica",
            fontSize=8,
            leading=9.5,
            textColor=BRAND_MUTED,
        ),
        "body": ParagraphStyle(
            "body",
            parent=base["Normal"],
            fontName="Helvetica",
            fontSize=7.2,
            leading=8.5,
            textColor=BRAND_TEXT,
        ),
        "col": ParagraphStyle(
            "col",
            parent=base["Normal"],
            fontName="Helvetica",
            fontSize=7.2,
            leading=8.4,
            textColor=BRAND_TEXT,
        ),
        "small": ParagraphStyle(
            "small",
            parent=base["Normal"],
            fontName="Helvetica",
            fontSize=6.8,
            leading=8,
            textColor=BRAND_MUTED,
        ),
        "login_label": ParagraphStyle(
            "login_label",
            parent=base["Normal"],
            fontName="Helvetica-Bold",
            fontSize=7.2,
            leading=8.5,
            textColor=BRAND_TEXT,
        ),
    }


def section(title, items):
    lines = "<br/>".join(f"• {item}" for item in items)
    return f"<font color='{TEAL}'><b>{title}</b></font><br/>{lines}"


def ref_line(task, dest):
    return f"• <b>{task}</b> → {dest}"


def login_box(styles):
    data = [
        [
            Paragraph("<b>URL</b>", styles["login_label"]),
            Paragraph("<b>https://dokind.ai</b>", styles["body"]),
        ],
        [
            Paragraph("<b>Email</b>", styles["login_label"]),
            Paragraph("carly.bryant@kw.com", styles["body"]),
        ],
        [
            Paragraph("<b>Password</b>", styles["login_label"]),
            Paragraph("[provided separately]", styles["body"]),
        ],
    ]
    t = Table(data, colWidths=[0.72 * inch, 5.78 * inch])
    t.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), colors.white),
                ("BOX", (0, 0), (-1, -1), 0.75, BRAND_BORDER),
                ("INNERGRID", (0, 0), (-1, -1), 0.5, BRAND_BORDER),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("LEFTPADDING", (0, 0), (-1, -1), 5),
                ("TOPPADDING", (0, 0), (-1, -1), 2),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 2),
            ]
        )
    )
    return t


def main():
    OUT.parent.mkdir(parents=True, exist_ok=True)
    styles = build_styles()
    story = []

    header = Table(
        [[
            Paragraph(
                "Do Kind · LC/TC Command<br/>"
                "<font size='8' color='#6B6764'>KW Austin Northwest · Carly Bryant</font>",
                styles["title"],
            )
        ]],
        colWidths=[6.5 * inch],
    )
    header.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), BRAND_BG),
                ("LINEBELOW", (0, 0), (-1, -1), 2, BRAND_CORAL),
                ("LEFTPADDING", (0, 0), (-1, -1), 8),
                ("TOPPADDING", (0, 0), (-1, -1), 5),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
            ]
        )
    )
    story.append(header)
    story.append(Spacer(1, 3))
    story.append(
        Paragraph(
            "Login once at <b>https://dokind.ai</b>, then start every day on <b>Today</b>. "
            "Nothing sends without your approval.",
            styles["subtitle"],
        )
    )
    story.append(Spacer(1, 2))
    story.append(login_box(styles))
    story.append(Spacer(1, 3))

    left_html = "<br/>".join(
        [
            section(
                "First login (5 min)",
                [
                    "Sign in at <b>https://dokind.ai</b>.",
                    "Complete the <b>2-minute tour</b> (replay in sidebar).",
                    "Bookmark on phone + laptop.",
                    "Test templates + ask <b>Assistant</b> for a briefing.",
                ],
            ),
            section(
                "Daily workflow",
                [
                    "<b>Today</b> — overdue, due today, awaiting review.",
                    "<b>Start here</b> — new listing or contract intake.",
                    "<b>Review queue</b> — approve/reject before send.",
                    "<b>Inbox triage</b> — paste email → P0–P3.",
                ],
            ),
            section(
                "Compliance",
                [
                    "Go-live needs your approval on the listing file.",
                    "Wire changes = phone verification only.",
                    "All client email through Review queue first.",
                ],
            ),
        ]
    )

    right_html = "<br/>".join(
        [
            f"<font color='{TEAL}'><b>Quick reference</b></font>",
            ref_line("Morning priorities", "Today"),
            ref_line("New listing", "New listing intake"),
            ref_line("New contract", "New contract intake"),
            ref_line("Approve before send", "Review queue"),
            ref_line("Classify mail", "Inbox triage"),
            ref_line("Open a file", "Listings / Transactions"),
            ref_line("Templates / AI help", "Email templates / Assistant"),
            f"<br/><font color='{TEAL}'><b>Weekly rhythm</b></font>",
            "• <b>Mon</b> — Today + Listings; triage weekend mail",
            "• <b>Tue</b> — Review queue; client updates by 3 PM CT",
            "• <b>Wed</b> — Active files; vendor deadlines",
            "• <b>Thu</b> — Compliance + MC review items",
            "• <b>Fri</b> — Close-out files; clear Review queue",
            "<br/><b>Need help?</b> Reply to the welcome email. "
            "Login issues: screenshot + phone or desktop.",
        ]
    )

    body = Table(
        [[Paragraph(left_html, styles["col"]), Paragraph(right_html, styles["col"])]],
        colWidths=[3.25 * inch, 3.25 * inch],
    )
    body.setStyle(
        TableStyle(
            [
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 0),
                ("RIGHTPADDING", (0, 0), (0, 0), 10),
            ]
        )
    )
    story.append(body)
    story.append(Spacer(1, 2))
    story.append(HRFlowable(width="100%", thickness=0.5, color=BRAND_BORDER))
    story.append(
        Paragraph(
            "Proprietary — Keller Williams Austin Northwest · TREC #723235-SA · dokind.ai",
            styles["small"],
        )
    )

    doc = SimpleDocTemplate(
        str(OUT),
        pagesize=letter,
        leftMargin=0.45 * inch,
        rightMargin=0.45 * inch,
        topMargin=0.35 * inch,
        bottomMargin=0.3 * inch,
        title="Do Kind LC/TC Command — Carly Bryant Quick Start",
        author="Do Kind Group",
    )
    doc.build(story)
    print(f"Wrote {OUT}")


if __name__ == "__main__":
    main()
