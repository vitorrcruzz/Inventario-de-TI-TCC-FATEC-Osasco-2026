from datetime import datetime, date
from backend.database import db
from backend.models import Dispositivo

DISPOSITIVOS_FIXOS = [
    # ── Infraestrutura ──────────────────────────────────
    {
        "ip": "172.20.0.1", "hostname": "GW-LAB-01",
        "tipo": "Roteador", "modelo": "Gateway Docker - Rede lab-network",
        "sistema_op": "Linux (Docker Network)", "armazenamento": "—",
        "memoria": "—", "processador": "—",
        "descricao": "Gateway padrao da rede virtual Docker 172.20.0.0/24",
        "localizacao": "Laboratorio de Redes - Infraestrutura Virtual",
        "contato": "suporte.ti@fatec.osasco.sp.gov.br",
        "interfaces": 1, "uptime": "—", "status": "online",
        "licenca_software": "—", "licenca_expira": None,
    },
    {
        "ip": "172.20.0.2", "hostname": "SRV-INVENTARIO",
        "tipo": "Servidor", "modelo": "Servidor de Inventario TI - Docker Container",
        "sistema_op": "Python 3.11 / Flask / Ubuntu 22.04",
        "armazenamento": "SSD (volume Docker)", "memoria": "Compartilhada com host",
        "processador": "Compartilhado com host",
        "descricao": "Servidor da aplicacao de inventario - Flask + SQLite + APScheduler",
        "localizacao": "Laboratorio de Redes - Servidor Virtual",
        "contato": "suporte.ti@fatec.osasco.sp.gov.br",
        "interfaces": 1, "uptime": "—", "status": "online",
        "licenca_software": "Ubuntu 22.04 LTS", "licenca_expira": date(2027, 4, 30),
    },
    # ── Dispositivos offline ────────────────────────────
    {
        "ip": "172.20.0.20", "hostname": "NB-LAB-01", "tipo": "Notebook",
        "modelo": "Dell Inspiron 15 3511", "sistema_op": "Windows 11 Pro 23H2",
        "armazenamento": "SSD 256GB", "memoria": "16GB DDR4",
        "processador": "Intel Core i7-1165G7",
        "descricao": "Windows 11 Pro 23H2 - Intel Core i7-1165G7 / 16GB RAM",
        "localizacao": "Laboratorio de Redes - Bancada 03",
        "contato": "lab.informatica@fatec.osasco.sp.gov.br",
        "interfaces": 2, "uptime": "—", "status": "offline",
        "licenca_software": "Windows 11 Pro", "licenca_expira": date(2025, 10, 14),
    },
    {
        "ip": "172.20.0.21", "hostname": "NB-LAB-02", "tipo": "Notebook",
        "modelo": "Dell Inspiron 15 3525", "sistema_op": "Windows 11 Pro 23H2",
        "armazenamento": "SSD 256GB", "memoria": "8GB DDR4",
        "processador": "Intel Core i5-1235U",
        "descricao": "Windows 11 Pro 23H2 - Intel Core i5-1235U / 8GB RAM",
        "localizacao": "Laboratorio de Redes - Bancada 04",
        "contato": "lab.informatica@fatec.osasco.sp.gov.br",
        "interfaces": 2, "uptime": "—", "status": "offline",
        "licenca_software": "Windows 11 Pro", "licenca_expira": date(2026, 6, 30),
    },
    {
        "ip": "172.20.0.22", "hostname": "PC-LAB-03", "tipo": "Computador",
        "modelo": "Desktop Dell OptiPlex 3070", "sistema_op": "Windows 10 Pro 22H2",
        "armazenamento": "SSD 256GB", "memoria": "8GB DDR4",
        "processador": "Intel Core i3-10100",
        "descricao": "Windows 10 Pro 22H2 - Intel Core i3-10100 / 8GB RAM",
        "localizacao": "Laboratorio de Redes - Bancada 05",
        "contato": "lab.informatica@fatec.osasco.sp.gov.br",
        "interfaces": 2, "uptime": "—", "status": "offline",
        "licenca_software": "Windows 10 Pro", "licenca_expira": date(2025, 10, 14),
    },
    {
        "ip": "172.20.0.23", "hostname": "IMP-LAB-02", "tipo": "Impressora",
        "modelo": "HP LaserJet Pro M428fdw", "sistema_op": "Firmware 003_2109A",
        "armazenamento": "Flash 256MB", "memoria": "512MB",
        "processador": "ARM Cortex-A9",
        "descricao": "HP LaserJet Pro M428fdw Firmware 003_2109A",
        "localizacao": "Laboratorio de Redes - Estacao de Impressao 2",
        "contato": "suporte.ti@fatec.osasco.sp.gov.br",
        "interfaces": 3, "uptime": "—", "status": "offline",
        "licenca_software": "—", "licenca_expira": None,
    },
    {
        "ip": "172.20.0.24", "hostname": "FW-LAB-01", "tipo": "Firewall",
        "modelo": "pfSense CE 2.7.2", "sistema_op": "pfSense CE 2.7.2 (FreeBSD)",
        "armazenamento": "SSD 32GB", "memoria": "4GB DDR4",
        "processador": "Intel Celeron J4125",
        "descricao": "Firewall pfSense - Protecao de perimetro do laboratorio",
        "localizacao": "Laboratorio de Redes - Rack Principal",
        "contato": "suporte.ti@fatec.osasco.sp.gov.br",
        "interfaces": 4, "uptime": "—", "status": "offline",
        "licenca_software": "pfSense CE (Open Source)", "licenca_expira": None,
    },
]

# Licenças dos dispositivos online (gerenciadas pelo seed pois o SNMP não coleta isso)
LICENCAS_ONLINE = {
    "172.20.0.10": {"licenca_software": "Cisco IOS 15.2",        "licenca_expira": date(2027, 12, 31)},
    "172.20.0.11": {"licenca_software": "RouterOS 7 (Perpetua)", "licenca_expira": None},
    "172.20.0.12": {"licenca_software": "Windows 10 Pro",        "licenca_expira": date(2025, 10, 14)},
    "172.20.0.13": {"licenca_software": "Ubuntu 22.04 LTS",      "licenca_expira": date(2027, 4, 30)},
    "172.20.0.14": {"licenca_software": "HP Firmware (Gratuito)","licenca_expira": None},
    "172.20.0.15": {"licenca_software": "UniFi (Gratuito)",      "licenca_expira": None},
    "172.20.0.16": {"licenca_software": "Hikvision (Gratuito)",  "licenca_expira": None},
    "172.20.0.17": {"licenca_software": "APC Firmware (Gratuito)","licenca_expira": None},
}

def popular_dispositivos_offline():
    # Insere/atualiza dispositivos fixos
    for dados in DISPOSITIVOS_FIXOS:
        existente = Dispositivo.query.filter_by(ip=dados["ip"]).first()
        if existente is None:
            novo = Dispositivo(**dados)
            novo.ultima_vez = datetime.now()
            novo.criado_em  = datetime.now()
            db.session.add(novo)
            print(f"[seed] Inserido: {dados['ip']} - {dados['hostname']}")
        else:
            campos = ["hostname", "tipo", "modelo", "sistema_op", "armazenamento",
                      "memoria", "processador", "descricao", "localizacao",
                      "contato", "interfaces", "licenca_software", "licenca_expira"]
            for k in campos:
                setattr(existente, k, dados[k])
            if dados["status"] == "offline":
                existente.status = "offline"

    # Atualiza licenças dos dispositivos online
    for ip, licenca in LICENCAS_ONLINE.items():
        d = Dispositivo.query.filter_by(ip=ip).first()
        if d:
            d.licenca_software = licenca["licenca_software"]
            d.licenca_expira   = licenca["licenca_expira"]

    db.session.commit()